'use client'

import { useState } from 'react'
import { X, Calendar, Clock } from 'lucide-react'

interface ScheduledOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onSchedule: (scheduledTime: Date) => void
  opensAt: string // e.g., "11:00 AM"
}

export default function ScheduledOrderModal({
  isOpen,
  onClose,
  onSchedule,
  opensAt
}: ScheduledOrderModalProps) {
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')

  if (!isOpen) return null

  const handleSchedule = () => {
    if (selectedDate && selectedTime) {
      const scheduledDateTime = new Date(`${selectedDate}T${selectedTime}`)
      onSchedule(scheduledDateTime)
      onClose()
    }
  }

  // Generate time options (every 15 minutes from 11 AM to 10 PM)
  const generateTimeOptions = () => {
    const times: string[] = []
    for (let hour = 11; hour <= 22; hour++) {
      for (let min = 0; min < 60; min += 15) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
        times.push(timeStr)
      }
    }
    return times
  }

  // Generate next 7 days
  const generateDateOptions = () => {
    const dates: { value: string; label: string }[] = []
    const today = new Date()

    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      const value = date.toISOString().split('T')[0]
      const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
      dates.push({ value, label })
    }

    return dates
  }

  const isValid = selectedDate && selectedTime

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl bg-white text-gray-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-6 bg-gradient-to-r from-[rgb(var(--color-primary))] to-blue-700 text-white">
          <h2 className="text-xl font-bold">Schedule Your Order</h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-800">We're currently closed</p>
                <p className="text-sm text-yellow-700 mt-1">
                  We open at {opensAt}. Schedule your order for pickup when we're open.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Select Date
            </label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-field"
            >
              <option value="">Choose a date</option>
              {generateDateOptions().map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Clock className="inline h-4 w-4 mr-1" />
              Select Time
            </label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="input-field"
              disabled={!selectedDate}
            >
              <option value="">Choose a time</option>
              {generateTimeOptions().map((time) => {
                const [hour, min] = time.split(':').map(Number)
                const period = hour >= 12 ? 'PM' : 'AM'
                const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
                return (
                  <option key={time} value={time}>
                    {displayHour}:{min.toString().padStart(2, '0')} {period}
                  </option>
                )
              })}
            </select>
          </div>

          {selectedDate && selectedTime && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4">
              <p className="text-sm font-semibold text-green-800">
                Your order will be ready for pickup on:
              </p>
              <p className="text-sm text-green-700 mt-1">
                {new Date(`${selectedDate}T${selectedTime}`).toLocaleString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleSchedule}
              disabled={!isValid}
              className="btn-primary flex-1"
            >
              Schedule Order
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
