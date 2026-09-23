export default function Spinner({ message = 'Cargando...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin">
        <div className="text-4xl">⏳</div>
      </div>
      <p className="text-gray-600 mt-4">{message}</p>
    </div>
  )
}
