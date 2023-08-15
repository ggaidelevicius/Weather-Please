import { Alert as MantineAlert } from '@mantine/core'
import { IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react'
import { AnimatePresence, motion } from 'framer-motion'
import React from 'react'
import styles from './styles.module.css'
import type { AlertProps } from './types'

const Alert = (props: AlertProps) => {
  const { totalPrecipitation, hoursOfExtremeUv, hoursOfHighWind, useMetric } = props

  let precipitationAlert = null
  if ((useMetric && totalPrecipitation >= 15) || totalPrecipitation >= 0.590551) {
    precipitationAlert = (
      <MantineAlert
        className={styles.alert}
        radius="md"
        styles={{ message: { fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' } }}
      >
        <IconInfoCircle size="2rem" strokeWidth={1.5} />
        {totalPrecipitation}{useMetric ? 'mm' : 'in'} of precipitation expected over the next 6 hours
      </MantineAlert>
    )
  }

  let windAlert = null
  if (hoursOfHighWind.includes(true)) {
    const alertProps = {
      className: styles.alert,
      radius: 'md',
      styles: { message: { fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' } },
    }
    const timeUntilHighWind = hoursOfHighWind.indexOf(true) + 1
    if (timeUntilHighWind > 1) {
      windAlert = (
        <MantineAlert {...alertProps} >
          <IconInfoCircle size="2rem" strokeWidth={1.5} />

          High wind starting in {timeUntilHighWind} hours
        </MantineAlert>
      )
    } else {
      const durationOfHighWind = hoursOfHighWind.indexOf(false)
      windAlert = (
        <MantineAlert {...alertProps}>
          <IconInfoCircle size="2rem" strokeWidth={1.5} />

          High wind for the next {durationOfHighWind > 0 ? `${durationOfHighWind} hours` : durationOfHighWind < 0 ? '12 hours' : 'hour'}
        </MantineAlert>
      )
    }
  }

  let uvAlert = null
  if (hoursOfExtremeUv.includes(true)) {
    const alertProps = {
      className: styles.alert,
      radius: 'md',
      color: 'yellow',
      styles: { message: { fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' } },
    }
    const timeUntilExtremeUv = hoursOfExtremeUv.indexOf(true) + 1
    if (timeUntilExtremeUv > 1) {
      uvAlert = (
        <MantineAlert {...alertProps} >
          <IconAlertTriangle size="2rem" strokeWidth={1.5} />
          Extreme UV starting in {timeUntilExtremeUv} hours
        </MantineAlert>
      )
    } else {
      const durationOfExtremeUv = hoursOfExtremeUv.indexOf(false)
      uvAlert = (
        <MantineAlert {...alertProps}>
          <IconAlertTriangle size="2rem" strokeWidth={1.5} />
          Extreme UV for the next {durationOfExtremeUv > 0 ? `${durationOfExtremeUv} hours` : durationOfExtremeUv < 0 ? '12 hours' : 'hour'}
        </MantineAlert>
      )
    }
  }

  const motionProps = {
    initial: { scale: 1, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { type: 'spring', duration: 1, delay: 2.375 } },
    exit: { scale: 0.95, opacity: 0 },
    className: styles.wrapper,
  }

  return (
    <AnimatePresence>
      {precipitationAlert &&
        <motion.div {...motionProps} key='precipitation'>
          {precipitationAlert}
        </motion.div>
      }
      {windAlert &&
        <motion.div {...motionProps} key='wind'>
          {windAlert}
        </motion.div>
      }
      {uvAlert &&
        <motion.div {...motionProps} key='uv'>
          {uvAlert}
        </motion.div>
      }
    </AnimatePresence>
  )
}

export default Alert
