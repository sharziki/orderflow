'use client'

import { useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface MenuOption {
  id: string
  name: string
  description?: string | null
  icon?: string | null
  isDefault?: boolean
}

interface MenuSelectorProps {
  menus: MenuOption[]
  selectedMenuId: string | null
  onMenuChange: (menuId: string) => void
  primaryColor?: string
}

export default function MenuSelector({
  menus,
  selectedMenuId,
  onMenuChange,
  primaryColor = '#2563eb'
}: MenuSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const selectedMenu = menus.find(m => m.id === selectedMenuId) || menus[0]
  
  if (menus.length <= 1) {
    return null // Don't show selector if only one menu
  }

  return (
    <div className="relative">
      {/* Desktop: Tab-style selector */}
      <div className="hidden sm:flex items-center gap-2 bg-white rounded-xl p-1.5 shadow-sm border border-gray-200">
        {menus.map((menu) => (
          <button
            key={menu.id}
            onClick={() => onMenuChange(menu.id)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              selectedMenuId === menu.id
                ? 'text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            style={selectedMenuId === menu.id ? { backgroundColor: primaryColor } : {}}
          >
            {menu.icon && <span className="text-lg">{menu.icon}</span>}
            {menu.name}
          </button>
        ))}
      </div>

      {/* Mobile: Dropdown selector */}
      <div className="sm:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-2">
            {selectedMenu?.icon && <span className="text-lg">{selectedMenu.icon}</span>}
            <span className="font-medium text-gray-900">{selectedMenu?.name || 'Select Menu'}</span>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <div className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              {menus.map((menu) => (
                <button
                  key={menu.id}
                  onClick={() => {
                    onMenuChange(menu.id)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 ${
                    selectedMenuId === menu.id ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {menu.icon && <span className="text-lg">{menu.icon}</span>}
                    <div className="text-left">
                      <div className="font-medium text-gray-900">{menu.name}</div>
                      {menu.description && (
                        <div className="text-xs text-gray-500">{menu.description}</div>
                      )}
                    </div>
                  </div>
                  {selectedMenuId === menu.id && (
                    <Check className="w-5 h-5" style={{ color: primaryColor }} />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
