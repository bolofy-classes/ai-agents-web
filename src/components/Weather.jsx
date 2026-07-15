import { useEffect, useState } from 'react'
import * as weatherApi from '../api/weather'

const DEFAULT_LOCATION = 'Bangalore'

function dayName(iso) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short' })
}

export default function Weather() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const load = (q) => {
      weatherApi
        .getWeather(q)
        .then((d) => { if (active) setData(d) })
        .catch((err) => { if (active) setError(err.message || 'Could not load weather') })
        .finally(() => { if (active) setLoading(false) })
    }

    // Ask for the user's location on load; fall back to Bangalore if denied.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => load(`${pos.coords.latitude},${pos.coords.longitude}`),
        () => load(DEFAULT_LOCATION),
        { timeout: 8000 }
      )
    } else {
      load(DEFAULT_LOCATION)
    }

    return () => { active = false }
  }, [])

  const card = 'rounded-2xl border border-neutral-200 bg-white p-5'

  if (loading) {
    return <div className={`${card} flex items-center justify-center text-[13px] text-neutral-400`}>Loading weather…</div>
  }
  if (error || !data?.current) {
    return <div className={`${card} flex items-center justify-center text-[13px] text-neutral-400`}>{error || 'Weather unavailable'}</div>
  }

  const { current, location, forecast } = data

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-br from-sky-600 to-indigo-700 p-5 text-white">
      <div className="mb-3 flex items-start justify-between">
        <div className="min-w-0">
          <div className="truncate text-[14px] font-semibold">{location?.name || 'Your location'}</div>
          <div className="truncate text-[11px] text-white/70">
            {[location?.region, location?.country].filter(Boolean).join(', ')}
          </div>
        </div>
        {current.icon && <img src={current.icon} alt={current.condition} className="h-12 w-12 flex-shrink-0" />}
      </div>

      <div className="mb-1 flex items-end gap-2">
        <span className="text-[44px] font-bold leading-none">{Math.round(current.tempC)}°</span>
        <span className="pb-1.5 text-[12px] text-white/80">Feels {Math.round(current.feelsLikeC)}°</span>
      </div>
      <div className="mb-4 text-[12px] font-medium text-white/90">{current.condition}</div>

      <div className="mb-4 flex gap-4 text-[11px] text-white/80">
        <span>💧 {current.humidity}%</span>
        <span>💨 {Math.round(current.windKph)} km/h</span>
      </div>

      {forecast?.length > 0 && (
        <div className="mt-auto grid grid-cols-3 gap-2 border-t border-white/15 pt-3">
          {forecast.map((f) => (
            <div key={f.date} className="text-center">
              <div className="text-[11px] text-white/70">{dayName(f.date)}</div>
              {f.icon && <img src={f.icon} alt="" className="mx-auto my-0.5 h-7 w-7" />}
              <div className="text-[11px]">
                <span className="font-semibold">{Math.round(f.maxC)}°</span>{' '}
                <span className="text-white/60">{Math.round(f.minC)}°</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
