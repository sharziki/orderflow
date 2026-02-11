'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, Trash2, Edit2, Eye, EyeOff, GripVertical, X, Save, 
  Sparkles, Image, Palette, Type, Megaphone, ChevronDown, ChevronUp,
  Loader2, Upload, ExternalLink, ArrowUp, ArrowDown
} from 'lucide-react'
import toast from 'react-hot-toast'
import PromoBanner, { PromoBannerData } from './PromoBanner'

const BANNER_TYPES = [
  { id: 'gradient', name: 'Gradient', icon: Palette, description: 'Colorful gradient background' },
  { id: 'image', name: 'Image', icon: Image, description: 'Custom image background' },
  { id: 'solid', name: 'Solid Color', icon: Type, description: 'Single color background' },
  { id: 'marquee', name: 'Scrolling Text', icon: Megaphone, description: 'Animated scrolling banner' },
  { id: 'floating', name: 'Floating Popup', icon: Sparkles, description: 'Corner popup notification' },
]

const BANNER_STYLES = [
  { id: 'hero', name: 'Hero Banner', description: 'Full-width prominent display' },
  { id: 'pill', name: 'Pill Badge', description: 'Compact centered pill' },
  { id: 'split', name: 'Split Layout', description: 'Image + text side by side' },
  { id: 'minimal', name: 'Minimal', description: 'Simple text bar' },
]

const POSITIONS = [
  { id: 'top', name: 'Top of Page' },
  { id: 'middle', name: 'Middle (after header)' },
  { id: 'bottom', name: 'Bottom of Page' },
  { id: 'floating', name: 'Floating Corner' },
]

const ANIMATIONS = [
  { id: 'fade', name: 'Fade In' },
  { id: 'slide', name: 'Slide Up' },
  { id: 'pulse', name: 'Pulse' },
  { id: 'none', name: 'None' },
]

const PRESET_GRADIENTS = [
  { from: '#2563eb', to: '#7c3aed', name: 'Blue to Purple' },
  { from: '#f97316', to: '#ef4444', name: 'Orange to Red' },
  { from: '#10b981', to: '#06b6d4', name: 'Green to Cyan' },
  { from: '#8b5cf6', to: '#ec4899', name: 'Purple to Pink' },
  { from: '#0ea5e9', to: '#3b82f6', name: 'Sky Blue' },
  { from: '#f59e0b', to: '#fbbf24', name: 'Amber Glow' },
  { from: '#1e293b', to: '#475569', name: 'Dark Slate' },
  { from: '#dc2626', to: '#b91c1c', name: 'Deep Red' },
]

interface BannerFormData {
  id?: string
  type: string
  style: string
  title: string
  subtitle: string
  buttonText: string
  buttonLink: string
  imageUrl: string
  bgColor: string
  textColor: string
  gradientFrom: string
  gradientTo: string
  position: string
  animation: string
  isActive: boolean
  isDismissible: boolean
}

const defaultFormData: BannerFormData = {
  type: 'gradient',
  style: 'hero',
  title: '',
  subtitle: '',
  buttonText: '',
  buttonLink: '',
  imageUrl: '',
  bgColor: '#2563eb',
  textColor: '#ffffff',
  gradientFrom: '#2563eb',
  gradientTo: '#7c3aed',
  position: 'top',
  animation: 'fade',
  isActive: true,
  isDismissible: false,
}

interface BannerSettingsProps {
  primaryColor?: string
}

export default function BannerSettings({ primaryColor = '#2563eb' }: BannerSettingsProps) {
  const [banners, setBanners] = useState<PromoBannerData[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<BannerFormData>(defaultFormData)
  const [showPreview, setShowPreview] = useState(false)
  const [expandedSections, setExpandedSections] = useState<string[]>(['type', 'content'])

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/promo-banners')
      if (res.ok) {
        const data = await res.json()
        setBanners(data)
      }
    } catch (error) {
      console.error('Failed to fetch banners:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const handleCreate = () => {
    setFormData({ ...defaultFormData, gradientFrom: primaryColor })
    setEditingId(null)
    setShowForm(true)
    setShowPreview(true)
  }

  const handleEdit = (banner: PromoBannerData) => {
    setFormData({
      id: banner.id,
      type: banner.type,
      style: banner.style,
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      buttonText: banner.buttonText || '',
      buttonLink: banner.buttonLink || '',
      imageUrl: banner.imageUrl || '',
      bgColor: banner.bgColor || '#2563eb',
      textColor: banner.textColor || '#ffffff',
      gradientFrom: banner.gradientFrom || '#2563eb',
      gradientTo: banner.gradientTo || '#7c3aed',
      position: banner.position,
      animation: banner.animation || 'fade',
      isActive: banner.isActive,
      isDismissible: banner.isDismissible || false,
    })
    setEditingId(banner.id)
    setShowForm(true)
    setShowPreview(true)
  }

  const handleSave = async () => {
    if (!formData.title?.trim()) {
      toast.error('Banner title is required')
      return
    }

    setSaving(true)
    try {
      const method = editingId ? 'PUT' : 'POST'
      const body = editingId ? { id: editingId, ...formData } : formData

      const res = await fetch('/api/promo-banners', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success(editingId ? 'Banner updated!' : 'Banner created!')
        setShowForm(false)
        setEditingId(null)
        fetchBanners()
      } else {
        toast.error('Failed to save banner')
      }
    } catch (error) {
      toast.error('Failed to save banner')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this banner?')) return

    try {
      const res = await fetch(`/api/promo-banners?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Banner deleted')
        setBanners(prev => prev.filter(b => b.id !== id))
      } else {
        toast.error('Failed to delete banner')
      }
    } catch (error) {
      toast.error('Failed to delete banner')
    }
  }

  const handleToggleActive = async (banner: PromoBannerData) => {
    try {
      const res = await fetch('/api/promo-banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: banner.id, isActive: !banner.isActive }),
      })

      if (res.ok) {
        setBanners(prev => prev.map(b => 
          b.id === banner.id ? { ...b, isActive: !b.isActive } : b
        ))
        toast.success(banner.isActive ? 'Banner hidden' : 'Banner visible')
      }
    } catch (error) {
      toast.error('Failed to update banner')
    }
  }

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const index = banners.findIndex(b => b.id === id)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === banners.length - 1) return

    const newBanners = [...banners]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    ;[newBanners[index], newBanners[swapIndex]] = [newBanners[swapIndex], newBanners[index]]
    setBanners(newBanners)

    try {
      await fetch('/api/promo-banners/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: newBanners.map(b => b.id) }),
      })
    } catch (error) {
      console.error('Failed to reorder:', error)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB')
      return
    }

    setUploading(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('type', 'banner')

      const res = await fetch('/api/upload', { method: 'POST', body: formDataUpload })
      if (res.ok) {
        const data = await res.json()
        setFormData(prev => ({ ...prev, imageUrl: data.url }))
        toast.success('Image uploaded!')
      } else {
        toast.error('Failed to upload image')
      }
    } catch (error) {
      toast.error('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const previewBanner: PromoBannerData = {
    id: 'preview',
    type: formData.type,
    style: formData.style,
    title: formData.title || 'Your Banner Title',
    subtitle: formData.subtitle,
    buttonText: formData.buttonText,
    buttonLink: formData.buttonLink,
    imageUrl: formData.imageUrl,
    bgColor: formData.bgColor,
    textColor: formData.textColor,
    gradientFrom: formData.gradientFrom,
    gradientTo: formData.gradientTo,
    position: formData.position,
    animation: 'none',
    isDismissible: formData.isDismissible,
    isActive: true,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Promotional Banners</h3>
          <p className="text-sm text-gray-500">Create eye-catching banners for your storefront</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Banner
        </button>
      </div>

      {/* Banners List */}
      {banners.length === 0 && !showForm && (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No banners yet</h3>
          <p className="text-gray-500 mb-4">Create your first promotional banner to highlight offers and announcements</p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            <Plus className="w-4 h-4" />
            Create Banner
          </button>
        </div>
      )}

      {banners.length > 0 && !showForm && (
        <div className="space-y-3">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className={`bg-white rounded-xl border shadow-sm overflow-hidden ${!banner.isActive ? 'opacity-60' : ''}`}
            >
              {/* Banner Preview Mini */}
              <div className="h-16 overflow-hidden">
                <div
                  className="h-full flex items-center px-4"
                  style={{
                    background: banner.type === 'image' && banner.imageUrl
                      ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${banner.imageUrl})`
                      : `linear-gradient(135deg, ${banner.gradientFrom || '#2563eb'} 0%, ${banner.gradientTo || '#7c3aed'} 100%)`,
                    backgroundSize: 'cover',
                    color: banner.textColor || '#ffffff'
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold truncate">{banner.title || 'Untitled Banner'}</h4>
                    {banner.subtitle && (
                      <p className="text-sm opacity-80 truncate">{banner.subtitle}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Controls */}
              <div className="px-4 py-3 bg-gray-50 flex items-center gap-2">
                <div className="flex items-center gap-1 mr-2">
                  <button
                    onClick={() => handleReorder(banner.id, 'up')}
                    disabled={index === 0}
                    className="p-1.5 hover:bg-gray-200 rounded disabled:opacity-30"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleReorder(banner.id, 'down')}
                    disabled={index === banners.length - 1}
                    className="p-1.5 hover:bg-gray-200 rounded disabled:opacity-30"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
                
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  banner.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {banner.isActive ? 'Active' : 'Hidden'}
                </span>
                
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium capitalize">
                  {banner.style}
                </span>
                
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium capitalize">
                  {banner.position}
                </span>
                
                <div className="flex-1" />
                
                <button
                  onClick={() => handleToggleActive(banner)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  title={banner.isActive ? 'Hide banner' : 'Show banner'}
                >
                  {banner.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                
                <button
                  onClick={() => handleEdit(banner)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => handleDelete(banner.id)}
                  className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl border shadow-lg overflow-hidden">
          {/* Form Header */}
          <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {editingId ? 'Edit Banner' : 'Create New Banner'}
            </h3>
            <button
              onClick={() => { setShowForm(false); setEditingId(null); setShowPreview(false) }}
              className="p-2 hover:bg-gray-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Banner Type */}
            <div>
              <button
                onClick={() => toggleSection('type')}
                className="w-full flex items-center justify-between text-left"
              >
                <span className="font-medium text-gray-900">Banner Type</span>
                {expandedSections.includes('type') ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              {expandedSections.includes('type') && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {BANNER_TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setFormData(prev => ({ ...prev, type: type.id }))}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        formData.type === type.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <type.icon className={`w-6 h-6 mb-2 ${formData.type === type.id ? 'text-blue-600' : 'text-gray-400'}`} />
                      <div className="font-medium text-gray-900">{type.name}</div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Banner Style (not for marquee/floating) */}
            {!['marquee', 'floating'].includes(formData.type) && (
              <div>
                <button
                  onClick={() => toggleSection('style')}
                  className="w-full flex items-center justify-between text-left"
                >
                  <span className="font-medium text-gray-900">Layout Style</span>
                  {expandedSections.includes('style') ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {expandedSections.includes('style') && (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {BANNER_STYLES.map(style => (
                      <button
                        key={style.id}
                        onClick={() => setFormData(prev => ({ ...prev, style: style.id }))}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          formData.style === style.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium text-gray-900">{style.name}</div>
                        <div className="text-xs text-gray-500">{style.description}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Content */}
            <div>
              <button
                onClick={() => toggleSection('content')}
                className="w-full flex items-center justify-between text-left"
              >
                <span className="font-medium text-gray-900">Content</span>
                {expandedSections.includes('content') ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              {expandedSections.includes('content') && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., 🔥 20% Off All Orders This Weekend!"
                      className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                    <input
                      type="text"
                      value={formData.subtitle}
                      onChange={e => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                      placeholder="e.g., Use code SAVE20 at checkout"
                      className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
                      <input
                        type="text"
                        value={formData.buttonText}
                        onChange={e => setFormData(prev => ({ ...prev, buttonText: e.target.value }))}
                        placeholder="Order Now"
                        className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Button Link</label>
                      <input
                        type="text"
                        value={formData.buttonLink}
                        onChange={e => setFormData(prev => ({ ...prev, buttonLink: e.target.value }))}
                        placeholder="/menu or https://..."
                        className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Image Upload (for image type) */}
            {formData.type === 'image' && (
              <div>
                <button
                  onClick={() => toggleSection('image')}
                  className="w-full flex items-center justify-between text-left"
                >
                  <span className="font-medium text-gray-900">Background Image</span>
                  {expandedSections.includes('image') ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {expandedSections.includes('image') && (
                  <div className="mt-4">
                    {formData.imageUrl ? (
                      <div className="relative rounded-lg overflow-hidden">
                        <img src={formData.imageUrl} alt="Banner" className="w-full h-32 object-cover" />
                        <button
                          onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                          className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 ${uploading ? 'opacity-50' : ''}`}>
                        {uploading ? (
                          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-500">Upload Image</span>
                          </>
                        )}
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                      </label>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Colors */}
            <div>
              <button
                onClick={() => toggleSection('colors')}
                className="w-full flex items-center justify-between text-left"
              >
                <span className="font-medium text-gray-900">Colors</span>
                {expandedSections.includes('colors') ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              {expandedSections.includes('colors') && (
                <div className="mt-4 space-y-4">
                  {/* Preset Gradients */}
                  {formData.type === 'gradient' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quick Presets</label>
                      <div className="flex flex-wrap gap-2">
                        {PRESET_GRADIENTS.map((preset, i) => (
                          <button
                            key={i}
                            onClick={() => setFormData(prev => ({ ...prev, gradientFrom: preset.from, gradientTo: preset.to }))}
                            className="w-10 h-10 rounded-lg shadow-sm hover:scale-110 transition-transform"
                            style={{ background: `linear-gradient(135deg, ${preset.from} 0%, ${preset.to} 100%)` }}
                            title={preset.name}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {formData.type !== 'solid' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Gradient Start</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={formData.gradientFrom}
                              onChange={e => setFormData(prev => ({ ...prev, gradientFrom: e.target.value }))}
                              className="w-10 h-10 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={formData.gradientFrom}
                              onChange={e => setFormData(prev => ({ ...prev, gradientFrom: e.target.value }))}
                              className="flex-1 px-3 py-2 border rounded-lg font-mono text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Gradient End</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={formData.gradientTo}
                              onChange={e => setFormData(prev => ({ ...prev, gradientTo: e.target.value }))}
                              className="w-10 h-10 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={formData.gradientTo}
                              onChange={e => setFormData(prev => ({ ...prev, gradientTo: e.target.value }))}
                              className="flex-1 px-3 py-2 border rounded-lg font-mono text-sm"
                            />
                          </div>
                        </div>
                      </>
                    )}
                    {formData.type === 'solid' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={formData.bgColor}
                            onChange={e => setFormData(prev => ({ ...prev, bgColor: e.target.value }))}
                            className="w-10 h-10 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={formData.bgColor}
                            onChange={e => setFormData(prev => ({ ...prev, bgColor: e.target.value }))}
                            className="flex-1 px-3 py-2 border rounded-lg font-mono text-sm"
                          />
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.textColor}
                          onChange={e => setFormData(prev => ({ ...prev, textColor: e.target.value }))}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={formData.textColor}
                          onChange={e => setFormData(prev => ({ ...prev, textColor: e.target.value }))}
                          className="flex-1 px-3 py-2 border rounded-lg font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Settings */}
            <div>
              <button
                onClick={() => toggleSection('settings')}
                className="w-full flex items-center justify-between text-left"
              >
                <span className="font-medium text-gray-900">Settings</span>
                {expandedSections.includes('settings') ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              {expandedSections.includes('settings') && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                      <select
                        value={formData.position}
                        onChange={e => setFormData(prev => ({ ...prev, position: e.target.value }))}
                        className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        {POSITIONS.map(pos => (
                          <option key={pos.id} value={pos.id}>{pos.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Animation</label>
                      <select
                        value={formData.animation}
                        onChange={e => setFormData(prev => ({ ...prev, animation: e.target.value }))}
                        className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        {ANIMATIONS.map(anim => (
                          <option key={anim.id} value={anim.id}>{anim.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="w-5 h-5 rounded text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Show on storefront</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isDismissible}
                        onChange={e => setFormData(prev => ({ ...prev, isDismissible: e.target.checked }))}
                        className="w-5 h-5 rounded text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Allow dismiss</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Live Preview */}
            {showPreview && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-900">Live Preview</span>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {showPreview ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="border rounded-xl overflow-hidden bg-gray-100">
                  <PromoBanner banner={previewBanner} primaryColor={primaryColor} />
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-end gap-3">
            <button
              onClick={() => { setShowForm(false); setEditingId(null); setShowPreview(false) }}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingId ? 'Update Banner' : 'Create Banner'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
