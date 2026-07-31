import { ArchivoForm } from "./ArchivoForm";
import { ArchivoView } from "./ArchivoView";
import type { Archivo } from "../../types";
import type { Setter } from "@/common/types";

type Props = {
  archivos: Archivo[]
  setArchivos: Setter<Archivo[]>
}

export const ArchivoComponent = ({archivos, setArchivos} : Props) =>{

  const handleRemove = (id) =>
    setArchivos((prev) => prev.filter((a) => a.id !== id));

  return (
    <div>
      <ArchivoForm setArchivos={setArchivos} />
      <ArchivoView archivos={archivos} onRemove={handleRemove} />
    </div>
  );
}