import { Link } from 'react-router-dom'
import { Headset, ShoppingBag, Wrench } from 'lucide-react'

export default function RoleSelect() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-purple-600 dark:text-purple-400 mb-2">Agiliza AI</h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg">Selecione seu papel</p>
      </div>
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl">
        <Link
          to="/cs/kanban"
          className="flex flex-col items-center gap-4 p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700 flex-1"
        >
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
            <Headset size={32} className="text-purple-600 dark:text-purple-400" />
          </div>
          <span className="text-xl font-semibold">CS</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">Suporte ao Cliente</span>
        </Link>
        <Link
          to="/comercial/kanban"
          className="flex flex-col items-center gap-4 p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700 flex-1"
        >
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <ShoppingBag size={32} className="text-green-600 dark:text-green-400" />
          </div>
          <span className="text-xl font-semibold">Comercial</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">Vendas e Negócios</span>
        </Link>
        <Link
          to="/tech"
          className="flex flex-col items-center gap-4 p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700 flex-1"
          onClick={(e) => {
            const senha = prompt('Digite a senha da Tech:')
            if (senha !== 'tech2024') {
              e.preventDefault()
              alert('Senha incorreta!')
            }
          }}
        >
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <Wrench size={32} className="text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-xl font-semibold">Tech</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">Time Técnico</span>
        </Link>
      </div>
    </div>
  )
}
