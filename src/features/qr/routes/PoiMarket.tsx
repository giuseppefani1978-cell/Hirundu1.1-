import React from "react";
import { useParams } from "react-router-dom";

export default function PoiMarket() {
  const { id } = useParams();
  return <div>Marché pour: {id ?? "?"}</div>;
}

