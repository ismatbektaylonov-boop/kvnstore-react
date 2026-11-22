import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { api, ApiError, clearCsrf } from "../../shared/api";
import { StoreCart, StoreMember, StoreProduct } from "../../shared/contracts";

const emptyCart: StoreCart = {
  items: [],
  subtotal: 0,
  currency: "USD",
  checkoutReady: false,
};
type LikeState = Pick<StoreProduct, "isLiked" | "productLikes">;
interface StoreContextValue {
  likes: Record<string, LikeState>;
  pendingLikes: Record<string, boolean>;
  uncertainLikes: Record<string, boolean>;
  retryFavorite: (id: string) => Promise<void>;
  likeErrors: Record<string, string>;
  favoritesVersion: number;
  toggleFavorite: (id: string) => Promise<void>;
  member: StoreMember | null;
  checking: boolean;
  authError: string;
  refreshMember: () => Promise<void>;
  setMember: (member: StoreMember) => void;
  logout: () => Promise<void>;
  cart: StoreCart;
  cartReady: boolean;
  cartError: string;
  refreshCart: () => Promise<void>;
  setCart: (cart: StoreCart) => void;
  notice: string;
  notify: (message: string) => void;
}
const StoreContext = createContext<StoreContextValue>(null!);
export const useStore = () => useContext(StoreContext);
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [member, setMemberState] = useState<StoreMember | null>(null);
  const [checking, setChecking] = useState(true);
  const [authError, setAuthError] = useState("");
  const [cart, setCart] = useState(emptyCart);
  const [cartReady, setCartReady] = useState(false);
  const [cartError, setCartError] = useState("");
  const [notice, notify] = useState("");
  const [likes, setLikes] = useState<Record<string, LikeState>>({});
  const [pendingLikes, setPendingLikes] = useState<Record<string, boolean>>({});
  const [uncertainLikes, setUncertainLikes] = useState<Record<string, boolean>>(
    {},
  );
  const unconfirmedLikes = useRef(new Set<string>());
  const [likeErrors, setLikeErrors] = useState<Record<string, string>>({});
  const [favoritesVersion, setFavoritesVersion] = useState(0);
  const likeRequests = useRef(new Set<string>());
  const identity = useRef<string | null>(null);
  const authRevision = useRef(0);
  const sessionRevision = useRef(0);
  const cartRevision = useRef(0);
  const setMember = useCallback((next: StoreMember | null) => {
    authRevision.current += 1;
    if (identity.current !== (next?._id ?? null)) {
      sessionRevision.current += 1;
      setLikes({});
      setPendingLikes({});
      setUncertainLikes({});
      unconfirmedLikes.current.clear();
      setLikeErrors({});
      likeRequests.current.clear();
      cartRevision.current += 1;
      setCart(emptyCart);
      setCartReady(false);
      setCartError("");
    }
    identity.current = next?._id ?? null;
    setMemberState(next);
    setChecking(false);
  }, []);
  const toggleFavorite = async (id: string) => {
    const account = identity.current;
    const revision = sessionRevision.current;
    if (
      !account ||
      likeRequests.current.has(id) ||
      unconfirmedLikes.current.has(id)
    )
      return;
    likeRequests.current.add(id);
    setPendingLikes((current) => ({ ...current, [id]: true }));
    setLikeErrors((current) => ({ ...current, [id]: "" }));
    const currentSession = () =>
      identity.current === account && sessionRevision.current === revision;
    try {
      const value = await api<LikeState>(`/product/${id}/like`, {
        method: "POST",
        body: {},
      });
      if (currentSession()) {
        setLikes((current) => ({ ...current, [id]: value }));
        setFavoritesVersion((v) => v + 1);
      }
    } catch (cause) {
      if (currentSession())
        setLikeErrors((current) => ({
          ...current,
          [id]: (cause as Error).message,
        }));
      // A timeout may follow a successful toggle. Reconcile with a read; never replay the toggle.
      try {
        const cards = await api<StoreProduct[]>(`/product/cards?ids=${id}`);
        if (!cards[0]) throw new Error("This product is no longer available.");
        if (currentSession()) {
          setLikes((current) => ({
            ...current,
            [id]: {
              isLiked: cards[0].isLiked,
              productLikes: cards[0].productLikes,
            },
          }));
          setFavoritesVersion((v) => v + 1);
        }
      } catch {
        if (currentSession()) {
          unconfirmedLikes.current.add(id);
          setUncertainLikes((current) => ({ ...current, [id]: true }));
          setLikeErrors((current) => ({
            ...current,
            [id]: "We couldn’t confirm your saved state. Check it before changing this favorite.",
          }));
        }
      }
    } finally {
      if (currentSession()) {
        likeRequests.current.delete(id);
        setPendingLikes((current) => ({ ...current, [id]: false }));
      }
    }
  };
  const retryFavorite = async (id: string) => {
    const account = identity.current;
    const revision = sessionRevision.current;
    if (!account || likeRequests.current.has(id)) return;
    const currentSession = () =>
      identity.current === account && sessionRevision.current === revision;
    likeRequests.current.add(id);
    setPendingLikes((current) => ({ ...current, [id]: true }));
    try {
      const cards = await api<StoreProduct[]>(`/product/cards?ids=${id}`);
      if (!cards[0]) throw new Error("This product is no longer available.");
      if (currentSession()) {
        setLikes((current) => ({
          ...current,
          [id]: {
            isLiked: cards[0].isLiked,
            productLikes: cards[0].productLikes,
          },
        }));
        unconfirmedLikes.current.delete(id);
        setUncertainLikes((current) => ({ ...current, [id]: false }));
        setLikeErrors((current) => ({ ...current, [id]: "" }));
        setFavoritesVersion((v) => v + 1);
      }
    } catch (cause) {
      if (currentSession())
        setLikeErrors((current) => ({
          ...current,
          [id]: (cause as Error).message,
        }));
    } finally {
      if (currentSession()) {
        likeRequests.current.delete(id);
        setPendingLikes((current) => ({ ...current, [id]: false }));
      }
    }
  };
  const refreshMember = useCallback(async () => {
    const revision = ++authRevision.current;
    setChecking(true);
    setAuthError("");
    try {
      const next = await api<StoreMember>("/member/detail", {
        suppressUnauthorized: true,
      });
      if (revision === authRevision.current) setMember(next);
    } catch (error) {
      if (revision !== authRevision.current) return;
      setMember(null);
      if (!(error instanceof ApiError && error.status === 401))
        setAuthError((error as Error).message);
    } finally {
      setChecking(false);
    }
  }, [setMember]);
  const refreshCart = useCallback(async () => {
    const requestedIdentity = identity.current;
    if (!requestedIdentity) return;
    const revision = ++cartRevision.current;
    setCartReady(false);
    setCartError("");
    try {
      const next = await api<StoreCart>("/cart", {
        suppressUnauthorized: true,
      });
      if (
        identity.current === requestedIdentity &&
        revision === cartRevision.current
      ) {
        setCart(next);
        setCartReady(true);
      }
    } catch (error) {
      if (
        identity.current !== requestedIdentity ||
        revision !== cartRevision.current
      )
        return;
      if (error instanceof ApiError && error.status === 401) setMember(null);
      else setCartError((error as Error).message);
    }
  }, [setMember]);
  useEffect(() => {
    // Remove legacy cached identity; the server is the authority after every refresh.
    try {
      localStorage.removeItem("memberData");
    } catch {
      /* Storage is optional. */
    }
    void refreshMember();
    const expired = () => {
      setMember(null);
      setCart(emptyCart);
    };
    window.addEventListener("kvn:unauthorized", expired);
    return () => window.removeEventListener("kvn:unauthorized", expired);
  }, [refreshMember, setMember]);
  useEffect(() => {
    if (member?._id) void refreshCart();
    else setCart(emptyCart);
  }, [member?._id, refreshCart]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => notify(""), 6000);
    return () => clearTimeout(timer);
  }, [notice]);
  const logout = async () => {
    await api("/member/logout", { method: "POST", body: {} });
    setMember(null);
    setCart(emptyCart);
    clearCsrf();
    notify("You have signed out.");
  };
  return (
    <StoreContext.Provider
      value={{
        likes,
        pendingLikes,
        uncertainLikes,
        retryFavorite,
        likeErrors,
        favoritesVersion,
        toggleFavorite,
        member,
        checking,
        authError,
        refreshMember,
        setMember,
        logout,
        cart,
        cartReady,
        cartError,
        refreshCart,
        setCart: (next) => {
          // A mutation started by a previous account must not restore its cart
          // after logout or an account switch.
          if (member && identity.current === member._id) {
            // A cart mutation is newer than any still-pending cart reads.
            cartRevision.current += 1;
            setCart(next);
            setCartReady(true);
            setCartError("");
          }
        },
        notice,
        notify,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}
export { useResource } from "../../shared/useResource";
