import { ArchivoForm } from "./ArchivoForm";
import { ArchivoView } from "./ArchivoView";
import type { Archivo } from "../../types";
import type { Setter } from "@/common/types";
import { TitledCard } from "@/common/components/TitleCard";

type Props = {
  archivos: Archivo[]
  setArchivos: Setter<Archivo[]>
}

export const ArchivoComponent = ({ archivos, setArchivos }: Props) => {

  const handleRemove = (id: number) =>
    setArchivos((prev) => prev.filter((archivo) => archivo.id !== id))

  return (
    <TitledCard
      titulo="Archivos"
      componente={<>
          <ArchivoForm archivos={archivos} setArchivos={setArchivos} />
          <ArchivoView archivos={archivos} onRemove={handleRemove} />
        </>}
    />
  )
}
