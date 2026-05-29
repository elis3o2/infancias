import { Box, Button, Typography } from "@mui/material"

type Props = {
  total: number
  offset: number
  limit: number
  setOffset: React.Dispatch<React.SetStateAction<number>>
}

export default function Pagination({ total, offset, limit, setOffset }: Props) {

  const totalPages = total ? Math.ceil(total / limit) : 0
  const currentPage = Math.floor(offset / limit) + 1

  const getPages = () => {
    const pages: number[] = []

    const start = Math.max(1, currentPage - 2)
    const end = Math.min(totalPages, currentPage + 2)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    return pages
  }

  const goToPage = (page: number) => {
    const newOffset = (page - 1) * limit
    setOffset(newOffset)
  }

  if (totalPages === 0) return null

  return (
    <Box>
      <Box display="flex" justifyContent="center" alignItems="center" mt={3} gap={1}>

        <Button
          disabled={currentPage === 1}
          onClick={() => goToPage(currentPage - 1)}
        >
          Anterior
        </Button>

        {getPages().map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? "contained" : "outlined"}
            onClick={() => goToPage(page)}
            size="small"
          >
            {page}
          </Button>
        ))}

        <Button
          disabled={currentPage === totalPages}
          onClick={() => goToPage(currentPage + 1)}
        >
          Siguiente
        </Button>

      </Box>

      <Typography align="center" mt={1}>
        Página {currentPage} de {totalPages}
      </Typography>
    </Box>
  )
}