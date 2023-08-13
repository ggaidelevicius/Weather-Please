/* eslint-disable @next/next/no-img-element */
import { ActionIcon, Button, Modal, Skeleton, Switch, Text, TextInput, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconSettings } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import type { Location } from './types'

const Settings = (props: any) => {
  const { input, handleChange, handleClick, config } = props
  const [opened, { open, close }] = useDisclosure(false)
  const [location, setLocation] = useState<Location>({
    country: '',
    suburb: '',
  })

  useEffect(() => {
    const reverseGeocode = async () => {
      try {
        const req = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${config.lat}&lon=${config.lon}&format=json`)
        const res = await req.json()
        const { address: { country, suburb } } = res
        setLocation({
          country: country,
          suburb: suburb,
        })
      } catch (e) {
        console.warn(e)
        notifications.show({
          title: 'Error',
          message: 'An error has occurred while fetching your location. Please check the console for more details.',
          color: 'red',
        })
      }
    }
    if (config.lat && config.lon && opened) {
      reverseGeocode()
    }
    return () => { }
  }, [config, opened])

  return (
    <>
      <ActionIcon
        aria-label="Open settings"
        title="Open settings"
        variant="light"
        color="dark"
        onClick={open}
        style={{ position: 'absolute', bottom: '1rem', right: '1rem' }}
      >
        <IconSettings />
      </ActionIcon>

      <Modal
        opened={opened}
        onClose={close}
        centered
        size="auto"
        padding="lg"
        radius="md"
        withCloseButton={false}
        sx={{
          maxWidth: '70ch',
        }}
      >
        <Title order={1}>Settings</Title>
        <Text mt="md" sx={{ display: 'flex', alignItems: 'center' }}>
          Based on the provided information, your location is&nbsp;{(!location.suburb || !location.country) && <Skeleton width={160} height={21} sx={{ display: 'inline-block' }} />} {(location.suburb || location.country) && <strong>{location.suburb && `${location.suburb},`} {location.country}</strong>}
        </Text>
        <Text>
          If this is incorrect, please update the values below.
        </Text>
        <TextInput
          mt="xs"
          label="Latitude"
          withAsterisk
          value={input.lat}
          onChange={(e) => { handleChange('lat', e.target.value.trim()) }}
          error={(/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/).test(input.lat) || input.lat === '' ? undefined : 'Invalid latitude value'}
        />
        <TextInput
          mt="xs"
          label="Longitude"
          withAsterisk
          value={input.lon}
          onChange={(e) => { handleChange('lon', e.target.value.trim()) }}
          error={(/^[-+]?((1[0-7]\d(\.\d+)?)|(180(\.0+)?|((\d{1,2}(\.\d+)?))))$/).test(input.lon) || input.lon === '' ? undefined : 'Invalid longitude value'}
        />
        <Text
          component="a"
          href="https://support.google.com/maps/answer/18539?hl=en&co=GENIE.Platform%3DDesktop#:~:text=Get%20the%20coordinates,latitude%20and%20longitude."
          target="_blank"
          rel="noopener noreferrer"
          size="sm"
          color="blue"
          sx={{ '&:hover': { textDecoration: 'underline' } }}
        >
          Unsure how to find these? Click here.
        </Text>
        <Switch
          label="Periodically update location automatically"
          mt="md"
          checked={input.periodicLocationUpdate}
          onChange={(e) => { handleChange('periodicLocationUpdate', e.target.checked) }}
        />
        <Text size="sm" color="dimmed">
          Note: This requires browser permissions
        </Text>
        <Button
          onClick={() => { handleClick('manual'); close() }}
          mt="md"
          fullWidth
          disabled={!(/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/).test(input.lat) || !(/^[-+]?((1[0-7]\d(\.\d+)?)|(180(\.0+)?|((\d{1,2}(\.\d+)?))))$/).test(input.lon)}
        >
          Save
        </Button>
      </Modal>
    </>
  )
}

export default Settings
