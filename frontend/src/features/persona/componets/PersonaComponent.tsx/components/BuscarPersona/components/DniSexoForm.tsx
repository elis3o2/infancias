import { useEffect } from "react";
import { Box } from "@mui/material";
import type { Setter } from "@/common/types";
import { SexoForm } from "./SexoForm";
import { DniForm } from "./DniForm";

type Props = {
    dni: string | null;
    setDni: Setter<string>;
    sexo: "M" | "F" | "";
    setSexo: Setter<"M" | "F" | "">;
    submitted: boolean;
    lookSexo: "M" | "F" | null
};

export const DniSexoForm = ({dni, setDni, sexo, setSexo, submitted, lookSexo}: Props) => {
    
    useEffect(() => {
        if (lookSexo) {
            setSexo(lookSexo);
        }
    }, [lookSexo]);

    return (
        <Box>
            <DniForm
                dni={dni}
                setDni={setDni}
            />

            {lookSexo === null && (
                <SexoForm
                    sexo={sexo}
                    setSexo={setSexo}
                    submitted={submitted}
                />
            )}
        </Box>
    );
};