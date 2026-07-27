import { useState } from "react";
import { ArchivoForm } from "./ArchivoForm";
import { ArchivoView } from "./ArchivoView";

type Props = {
    archivos
}

export const ArchivoComponent() {
  const [archivos, setArchivos] = useState([]);

  const handleAdd = (nuevos) =>
    setArchivos((prev) => [...prev, ...nuevos]);

  const handleRemove = (id) =>
    setArchivos((prev) => prev.filter((a) => a.id !== id));

  return (
    <div>
      <ArchivoForm onAdd={handleAdd} />
      <ArchivoView archivos={archivos} onRemove={handleRemove} />
    </div>
  );
}