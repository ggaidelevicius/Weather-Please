/* eslint-disable @next/next/no-img-element */
import Alert from '@/components/alert'
import type { CurrentWeatherProps } from '@/components/alert/types'
import Initialisation from '@/components/intialisation'
import Settings from '@/components/settings'
import Tile from '@/components/tile'
import type { TileProps } from '@/components/tile/types'
import { Loader } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import * as Sentry from '@sentry/nextjs'
import { AnimatePresence, motion } from 'framer-motion'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import styles from './styles.module.css'
import type { ConfigProps, HandleChange, HandleClick } from './types'

const WeatherPlease: FC = () => {
  const [currentWeatherData, setCurrentWeatherData] = useState<CurrentWeatherProps>({
    totalPrecipitation: {
      precipitation: {
        value: 0,
        flag: false,
      },
      duration: [false],
    },
    hoursOfExtremeUv: [false],
    hoursOfHighWind: [false],
    hoursOfLowVisibility: [false],
  })
  const [futureWeatherData, setFutureWeatherData] = useState<[] | TileProps[]>([])
  const [currentHour, setCurrentHour] = useState<number>(new Date().getHours())
  const [currentDate, setCurrentDate] = useState<number>(new Date().getDate())
  const [loading, setLoading] = useState<boolean>(false)
  const [geolocationError, setGeolocationError] = useState<boolean>(false)
  const [opened, { open, close }] = useDisclosure(false)
  const initialState: ConfigProps = {
    lat: '',
    lon: '',
    periodicLocationUpdate: false,
    useMetric: true,
    showAlerts: true,
    showUvAlerts: true,
    showWindAlerts: true,
    showVisibilityAlerts: true,
    showPrecipitationAlerts: true,
    daysToRetrieve: '3',
    identifier: 'day',
    shareCrashesAndErrors: false,
  }
  const [config, setConfig] = useState<ConfigProps>(initialState)
  const [input, setInput] = useState<ConfigProps>(initialState)
  const [usingFreshData, setUsingFreshData] = useState<boolean>(false)

  useEffect(() => {
    const removeLocalStorageData = () => {
      if (localStorage.data) {
        localStorage.removeItem('data')
      }
    }

    window.addEventListener('beforeunload', removeLocalStorageData)

    return () => {
      window.removeEventListener('beforeunload', removeLocalStorageData)
    }
  }, [])

  useEffect(() => {
    if (config.shareCrashesAndErrors) {
      Sentry.init({
        dsn: 'https://f3641aec69a23937c89259888e252f19@o4505788641771520.ingest.sentry.io/4505788646817792',
        tracesSampleRate: 1,
        debug: false,
        replaysOnErrorSampleRate: 1.0,
        replaysSessionSampleRate: 0,
        beforeSend: (event) => event,
      })
    }
    return () => { }
  }, [config.shareCrashesAndErrors])

  const compareObjects = (obj1: Partial<unknown>, obj2: Partial<unknown>): boolean => {
    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)

    return keys1.length === keys2.length && keys1.every(key => keys2.includes(key))
  }

  const mergeObjects = (targetObj: Partial<any>, sourceObj: Partial<any>) => {
    const mergedObject = { ...targetObj }

    Object.keys(sourceObj).forEach(key => {
      if (!mergedObject.hasOwnProperty(key)) {
        mergedObject[key] = sourceObj[key]
      }
    })

    return mergedObject as ConfigProps
  }

  useEffect(() => {
    const storedData = localStorage?.config ? JSON.parse(localStorage.config) : null
    if (storedData) {
      const objectShapesMatch = compareObjects(storedData, config)
      if (objectShapesMatch) {
        setConfig(storedData)
        setInput(storedData)
      } else {
        const mergedObject = mergeObjects(storedData, config)
        setConfig(mergedObject)
        setInput(mergedObject)
      }
    }
    else {
      open()
    }
    return () => { }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const req = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${config.lat}&longitude=${config.lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max,windspeed_10m_max&timeformat=unixtime&timezone=auto&hourly=precipitation,uv_index,windspeed_10m,visibility&forecast_days=${config.daysToRetrieve}${config.useMetric ? '' : '&temperature_unit=fahrenheit&windspeed_unit=mph&precipitation_unit=inch'}`)
        const res = await req.json()
        const futureData = res.daily.time.map((day: unknown, i: number) => ({
          day,
          max: res.daily.temperature_2m_max[i],
          min: res.daily.temperature_2m_min[i],
          description: res.daily.weathercode[i],
          uv: res.daily.uv_index_max[i],
          wind: res.daily.windspeed_10m_max[i],
          rain: res.daily.precipitation_probability_max[i],
        }))
        setFutureWeatherData(futureData)
        localStorage.data = JSON.stringify(futureData)
        setCurrentWeatherData({
          totalPrecipitation: {
            precipitation: res.hourly.precipitation.slice(0, 24).reduce((p: { value: number, flag: boolean }, c: number) => {
              if (p.flag || c === 0) {
                return { value: p.value, flag: true }
              }
              return { value: p.value + c, flag: false }
            }, { value: 0, flag: false }),
            duration: res.hourly.precipitation.slice(0, 24).map((val: number) => val > 0),
          },
          hoursOfExtremeUv: res.hourly.uv_index.slice(0, 12).map((val: number) => val >= 11),
          hoursOfHighWind: res.hourly.windspeed_10m.slice(0, 12).map((val: number) => val >= (config.useMetric ? 60 : 37)),
          hoursOfLowVisibility: res.hourly.visibility.slice(0, 12).map((val: number) => val <= 200),
        })
      } catch (e: any) {
        // eslint-disable-next-line no-console
        console.warn(e)
        // why can't i pass the value of state into message here?
        // why are these errors sometimes being shown + a console warning occurring despite data seemingly being fetched just fine?
        notifications.show({
          title: 'Error',
          message: 'An error has occurred while fetching weather data. Please check the console for more details.',
          color: 'red',
        })
      }
    }

    if (localStorage.data) { // need to do something for when number of days to retrieve changes
      setFutureWeatherData(JSON.parse(localStorage.data))
      setTimeout(() => { localStorage.removeItem('data') }, 30e4)
    } else {
      if (config.lat && config.lon) {
        fetchData()
      }
    }

    setInterval(() => {
      if (new Date().getHours() !== currentHour) {
        setCurrentHour(new Date().getHours())
      }
    }, 6e4)

    return () => { }
  }, [currentHour, config.lat, config.lon, config.daysToRetrieve, config.useMetric])

  const handleChange: HandleChange = (k, v) => {
    setInput((prev) => {
      return ({
        ...prev,
        [k]: v,
      })
    })
  }

  const handleClick: HandleClick = async (method) => {
    const userAgent = navigator.userAgent.toLowerCase()

    if (method === 'auto' && (!(userAgent.indexOf('safari') !== -1 && userAgent.indexOf('chrome') === -1))) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setConfig((prev) => ({
          ...prev,
          lat: pos.coords.latitude.toString(),
          lon: pos.coords.longitude.toString(),
        }))
        setInput((prev) => ({
          ...prev,
          lat: pos.coords.latitude.toString(),
          lon: pos.coords.longitude.toString(),
        }))
      })
      setTimeout(() => { setGeolocationError(true) }, 5e3)
    } else if (method === 'auto' && ((userAgent.indexOf('safari') !== -1) && userAgent.indexOf('chrome') === -1)) {
      try {
        const req = await fetch('http://ip-api.com/json/', {
          method: 'GET',
          mode: 'cors',
        })
        const res = await req.json()
        const { lat, lon } = res
        setConfig((prev) => ({
          ...prev,
          lat: lat,
          lon: lon,
        }))
        setInput((prev) => ({
          ...prev,
          lat: lat,
          lon: lon,
        }))
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(e)
        setGeolocationError(true)
      }
      setTimeout(() => { setGeolocationError(true) }, 5e3)
    } else {
      setConfig(input)
    }
  }

  useEffect(() => {
    if (config.lat && config.lon) {
      close()
    }
    return () => { }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config])

  useEffect(() => {
    setTimeout(() => {
      if (config.lat && config.lon) {
        localStorage.config = JSON.stringify(config)
        setUsingFreshData(true)
      }
    }, 1e3)
    return () => { }
  }, [config])

  useEffect(() => {
    setTimeout(() => {
      if (new Date().getDate() !== currentDate) {
        setCurrentDate(new Date().getDate())
      }
    }, 6e4)

    if (config.periodicLocationUpdate) {
      const userAgent = navigator.userAgent.toLowerCase()

      if (!(userAgent.indexOf('safari') !== -1) && userAgent.indexOf('chrome') === -1) {
        navigator.geolocation.getCurrentPosition((pos) => {
          setConfig((prev) => ({
            ...prev,
            lat: pos.coords.latitude.toString(),
            lon: pos.coords.longitude.toString(),
          }))
        })
      } else {
        const fetchSafariGeoData = async () => {
          try {
            const req = await fetch('http://ip-api.com/json/', {
              method: 'GET',
              mode: 'cors',
            })
            const res = await req.json()
            const { latitude, longitude } = res
            if (latitude && longitude) {
              setConfig((prev) => ({
                ...prev,
                lat: latitude,
                lon: longitude,
              }))
            }
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn(e)
            notifications.show({
              title: 'Error',
              message: 'An error has occurred while fetching location data. Please check the console for more details.',
              color: 'red',
            })
          }
        }
        fetchSafariGeoData()
      }
    }
    return () => { }
  }, [currentDate, config.periodicLocationUpdate])

  const tiles = () => (futureWeatherData.map((day, i: number) => {
    let delayBaseline = 0.75
    if (localStorage.data) {
      delayBaseline = 0
    }
    return (
      <motion.div
        key={day.day}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1, transition: { type: 'spring', duration: 2, delay: (i * .075) + delayBaseline } }}
        exit={{ scale: 0.95, opacity: 0 }}
        layout
        style={{ background: 'none' }}
      >
        <Tile {...day} useMetric={config.useMetric} identifier={config.identifier} index={i} />
      </motion.div>
    )
  })
  )

  const determineGridColumns = (daysToRetrieve: string): number => {
    const value = parseInt(daysToRetrieve)

    switch (value) {
      case 1:
        return 1
      case 2:
        return 2
      case 3:
        return 3
      case 4:
        return 4
      case 5:
        return 5
      case 6:
        return 3
      case 7:
        return 3
      case 8:
        return 4
      case 9:
        return 3
      default:
        return 3
    }
  }

  return (
    <>
      <AnimatePresence>
        {futureWeatherData.length === 0 && config.lat && config.lon &&
          <motion.div
            initial={{ scale: 1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            style={{ position: 'absolute', width: '100%', margin: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none' }}
          >
            <Loader variant='dots' size='lg' />
          </motion.div>
        }
      </AnimatePresence>

      <AnimatePresence>
        <motion.main
          layout={usingFreshData}
          className={styles.main}
          style={{
            gridTemplateColumns: `repeat(${determineGridColumns(config.daysToRetrieve)}, 1fr)`,
          }}
        >
          {tiles()}
          {config.showAlerts &&
            <Alert
              {...currentWeatherData}
              useMetric={config.useMetric}
              showUvAlerts={config.showUvAlerts}
              showWindAlerts={config.showWindAlerts}
              showVisibilityAlerts={config.showVisibilityAlerts}
              showPrecipitationAlerts={config.showPrecipitationAlerts}
              width={determineGridColumns(config.daysToRetrieve)}
            />
          }
        </motion.main>
      </AnimatePresence>

      <Settings
        input={input}
        handleChange={handleChange}
        handleClick={handleClick}
        config={config}
      />

      <Initialisation
        geolocationError={geolocationError}
        handleClick={handleClick}
        setLoading={setLoading}
        loading={loading}
        input={input}
        handleChange={handleChange}
        opened={opened}
        close={close}
      />

      <a
        href='https://open-meteo.com/'
        target='_blank'
        className={styles.link}
        style={{ position: 'fixed', bottom: '1rem', left: '1rem', fontSize: '0.75rem', color: 'hsl(220deg 2.78% 57.65%)', lineHeight: 1, textDecoration: 'none' }}
      >
        weather data provided by open-meteo
      </a>
    </>
  )
}

export default WeatherPlease
