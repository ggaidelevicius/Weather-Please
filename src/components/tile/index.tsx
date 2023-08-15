import { Card, Title } from '@mantine/core'
import type { FC } from 'react'
import styles from './styles.module.css'
import type { Days, TileProps } from './types'
import { BasicWeather, WeatherDetail } from './weather'

const Tile: FC<TileProps> = (props: TileProps) => {
  const { day } = props
  const days: Days[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  return (
    <Card component="article" padding="lg" radius="md" sx={{ userSelect: 'none' }}>
      <Title order={2} className={styles.title}>
        {days[new Date(day * 1000).getDay()]}
      </Title>
      <BasicWeather {...props} />
      <WeatherDetail {...props} />
    </Card>
  )
}

export default Tile
