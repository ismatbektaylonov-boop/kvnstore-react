import React, { useState } from "react";
import { Link } from "react-router-dom";
import CircularCarousel from "../components/carousels/CircularCarousel";
import "./HeroCarousel.css";

const items = [
  {
    src: "/media/images/carousel/everyday-cotton.jpg",
    alt: "Everyday shirts hanging neatly together",
    title: "Everyday essentials",
    subtitle: "Clothing",
    collection: "CLOTHE",
  },
  {
    src: "/media/images/carousel/fresh-sneakers.jpg",
    alt: "Red knit Nike sneaker photographed against a red background",
    title: "A fresh step",
    subtitle: "Shoes",
    collection: "SHOES",
  },
  {
    src: "/media/images/carousel/denim-days.jpg",
    alt: "Blue and black denim jeans with stitched pockets",
    title: "Denim days",
    subtitle: "Trousers",
    collection: "PANTS",
  },
  {
    src: "/media/images/carousel/finishing-touches.jpg",
    alt: "Black quilted leather shoulder bag with a gold clasp",
    title: "The finishing touch",
    subtitle: "Other essentials",
    collection: "OTHERS",
  },
  {
    src: "/media/images/carousel/everyday-cap.jpg",
    alt: "White baseball cap photographed on a light background",
    title: "Top it off",
    subtitle: "Hats",
    collection: "HAT",
  },
  {
    src: "/media/images/carousel/layering-jacket.jpg",
    alt: "Black leather jacket laid flat on white fabric",
    title: "Easy layers",
    subtitle: "Clothing",
    collection: "CLOTHE",
  },
  {
    src: "/media/images/carousel/cotton-edit.jpg",
    alt: "Sage green cotton T-shirts on wooden hangers",
    title: "The cotton edit",
    subtitle: "Clothing",
    collection: "CLOTHE",
  },
  {
    src: "/media/images/carousel/sport-sneakers.jpg",
    alt: "Tan low-top sneakers arranged on mustard fabric",
    title: "Off-duty favorites",
    subtitle: "Shoes",
    collection: "SHOES",
  },
  {
    src: "/media/images/carousel/daily-backpack.jpg",
    alt: "Navy backpack photographed against a light studio wall",
    title: "Carry the everyday",
    subtitle: "Other essentials",
    collection: "OTHERS",
  },
  {
    src: "/media/images/carousel/classic-watch.jpg",
    alt: "Analog wristwatch with a brown leather strap on a dark background",
    title: "A little timeless",
    subtitle: "Other essentials",
    collection: "OTHERS",
  },
  {
    src: "/media/images/carousel/sunglasses.jpg",
    alt: "Gold-framed sunglasses with green lenses on a white surface",
    title: "A brighter outlook",
    subtitle: "Other essentials",
    collection: "OTHERS",
  },
  {
    src: "/media/images/carousel/knit-beanie.jpg",
    alt: "Black and pink ribbed knit beanies laid flat",
    title: "Keep it cozy",
    subtitle: "Hats",
    collection: "HAT",
  },
  {
    src: "/media/images/carousel/leather-wallet.jpg",
    alt: "Brown leather bifold wallet on a dark green surface",
    title: "Small essentials",
    subtitle: "Other essentials",
    collection: "OTHERS",
  },
  {
    src: "/media/images/carousel/leather-belt.jpg",
    alt: "Brown leather belts with stitched edges and metal buckles",
    title: "Pull it together",
    subtitle: "Other essentials",
    collection: "OTHERS",
  },
  {
    src: "/media/images/carousel/soft-knit.jpg",
    alt: "Cream knitted layer hanging on a wooden hanger",
    title: "A softer side",
    subtitle: "Clothing",
    collection: "CLOTHE",
  },
  {
    src: "/media/images/carousel/weekend-bag.jpg",
    alt: "Gray travel backpack standing outdoors in warm sunlight",
    title: "Ready for the weekend",
    subtitle: "Other essentials",
    collection: "OTHERS",
  },
];

export default function HeroCarousel() {
  const [active, setActive] = useState(0);
  const [focused, setFocused] = useState(false);
  const current = items[active];

  return (
    <div
      className="kv-hero-carousel"
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setFocused(false);
        }
      }}
    >
      <div className="kv-hero-carousel__stage">
        <CircularCarousel
          items={items}
          preset="cylinder"
          intro="rise"
          cardWidth={300}
          scale={2.1}
          frontScale={1.28}
          aspectRatio={0.75}
          gap={84}
          speed={10}
          autoplay={focused ? "off" : "drift"}
          fadeColor="#F5F5F7"
          innerShade={0.82}
          depthFade={0.65}
          parallax={0.15}
          stretch={0.15}
          cornerRadius={12}
          captions
          onChange={setActive}
        />
      </div>
      <div className="kv-hero-carousel__footer">
        <Link
          className="kv-text-link"
          to={`/products?productCollection=${current.collection}`}
          aria-label={`Shop ${current.subtitle.toLowerCase()}`}
        >
          Shop this collection
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            aria-hidden="true"
          >
            <path d="M6 18 18 6M6 6h12v12" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
