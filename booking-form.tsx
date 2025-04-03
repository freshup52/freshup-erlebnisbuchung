"use client"

import { useState, useEffect } from "react"
import {
  CalendarIcon,
  CarIcon,
  PlaneTakeoffIcon,
  CheckIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  UserIcon,
  PhoneIcon,
  MailIcon,
  InfoIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

// Define time slots for different flight types
const TANDEM_SLOTS = {
  "17.05.2025": ["09:00", "11:00", "13:00", "15:00", "17:00"],
  "18.05.2025": ["09:00", "11:00", "13:00", "15:00"],
}

// Generate time slots from 8:00 to 21:00 in 30-minute intervals for regular flights
const generateRegularTimeSlots = () => {
  const slots = []
  for (let hour = 8; hour <= 20; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      // Don't add slots after 20:30
      if (hour === 20 && minute > 30) continue

      const formattedHour = hour.toString().padStart(2, "0")
      const formattedMinute = minute.toString().padStart(2, "0")
      const time = `${formattedHour}:${formattedMinute}`
      slots.push({ value: time, label: time })
    }
  }
  return slots
}

const REGULAR_TIME_SLOTS = generateRegularTimeSlots()

// Generate time slots from 8:00 to 21:00 in 10-minute intervals for vehicles
const generateVehicleTimeSlots = () => {
  const slots = []
  for (let hour = 8; hour <= 21; hour++) {
    for (let minute = 0; minute < 60; minute += 10) {
      // Don't add slots after 21:00
      if (hour === 21 && minute > 0) continue

      const formattedHour = hour.toString().padStart(2, "0")
      const formattedMinute = minute.toString().padStart(2, "0")
      const time = `${formattedHour}:${formattedMinute}`
      slots.push({ value: time, label: time })
    }
  }
  return slots
}

const VEHICLE_TIME_SLOTS = generateVehicleTimeSlots()

const DATES = [
  { value: "17.05.2025", label: "17.05.2025 (Samstag)" },
  { value: "18.05.2025", label: "18.05.2025 (Sonntag)" },
]

const VEHICLES = [
  { value: "schraeglagenmotorrad", label: "Schräglagenmotorrad" },
  { value: "audi-q6", label: "Audi Q6" },
  { value: "id-4", label: "ID 4" },
  { value: "cupra-born", label: "Cupra Born" },
  { value: "scania", label: "Scania" },
  { value: "scania-elektro", label: "Scania elektro" },
  { value: "kran", label: "Kran führen" },
  { value: "lkw-mercedes-1729", label: "LKW Mercedes 1729" },
  { value: "setra", label: "Setra" },
  { value: "fendt-211", label: "Fendt 211" },
  { value: "fendt-314", label: "Fendt 314" },
  { value: "fendt-620", label: "Fendt 620" },
]

const FLIGHTS = [
  { value: "erlebnisflug-pipistrel-elektro", label: "Erlebnisflug Pipistrel Elektro – 50 CHF", type: "regular" },
  { value: "erlebnisflug-pipistrel-verbrenner", label: "Erlebnisflug Pipistrel Verbrenner – 75 CHF", type: "regular" },
  { value: "erlebnisflug-bristel-b23", label: "Erlebnisflug Bristel B23 – 100 CHF", type: "regular" },
  { value: "schnupperflug-pipistrel-elektro", label: "Schnupperflug Pipistrel Elektro – 50 CHF", type: "regular" },
  {
    value: "schnupperflug-pipistrel-verbrenner",
    label: "Schnupperflug Pipistrel Verbrenner – 75 CHF",
    type: "regular",
  },
  { value: "schnupperflug-bristel-b23", label: "Schnupperflug Bristel B23 – 100 CHF", type: "regular" },
  { value: "schnupperflug-helikopter", label: "Schnupperflug Helikopter – 150 CHF", type: "helicopter" },
  { value: "erlebnisflug-helikopter", label: "Erlebnisflug Helikopter – 50 CHF", type: "helicopter" },
  { value: "tandemflug-helikopter", label: "Tandemflug Helikopter – 380 CHF", type: "tandem" },
]

// Mock database for bookings
type Booking = {
  type: string
  vehicle?: string
  flight?: string
  date: string
  time: string
  count?: number
}

// In a real app, this would be fetched from a database
const BOOKINGS: Booking[] = []

const formSchema = z.object({
  type: z.string(),
  vehicle: z.string().optional(),
  flight: z.string().optional(),
  date: z.string({
    required_error: "Bitte wählen Sie ein Datum aus.",
  }),
  time: z.string({
    required_error: "Bitte wählen Sie eine Uhrzeit aus.",
  }),
  firstName: z.string().min(2, {
    message: "Vorname muss mindestens 2 Zeichen lang sein.",
  }),
  lastName: z.string().min(2, {
    message: "Nachname muss mindestens 2 Zeichen lang sein.",
  }),
  street: z.string().min(5, {
    message: "Strasse und Nr. muss ausgefüllt werden.",
  }),
  postalCode: z.string().min(4, {
    message: "Bitte geben Sie eine gültige Postleitzahl ein.",
  }),
  city: z.string().min(2, {
    message: "Bitte geben Sie einen gültigen Ort ein.",
  }),
  birthDate: z.string().min(10, {
    message: "Bitte geben Sie ein gültiges Geburtsdatum ein (TT.MM.JJJJ).",
  }),
  email: z.string().email({
    message: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
  }),
})

export default function BookingForm() {
  const [bookingType, setBookingType] = useState("vehicle")
  const [submitted, setSubmitted] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedFlight, setSelectedFlight] = useState("")
  const [selectedVehicle, setSelectedVehicle] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [availableTimeSlots, setAvailableTimeSlots] = useState<{ value: string; label: string }[]>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "vehicle",
      date: "",
      time: "",
      firstName: "",
      lastName: "",
      street: "",
      postalCode: "",
      city: "",
      birthDate: "",
      email: "",
    },
  })

  // Update available time slots when date or flight type changes
  useEffect(() => {
    if (!selectedDate) return

    if (bookingType === "vehicle") {
      setAvailableTimeSlots(getAvailableVehicleSlots(selectedDate, selectedVehicle))
    } else if (selectedFlight) {
      const flightType = FLIGHTS.find((f) => f.value === selectedFlight)?.type || "regular"
      setAvailableTimeSlots(getAvailableFlightSlots(selectedDate, flightType, selectedFlight))
    }
  }, [selectedDate, bookingType, selectedFlight, selectedVehicle])

  // Get available time slots for vehicles
  const getAvailableVehicleSlots = (date: string, vehicle: string) => {
    // Filter out slots that are already booked for this vehicle
    return VEHICLE_TIME_SLOTS.filter((slot) => {
      const isBooked = BOOKINGS.some(
        (booking) => booking.date === date && booking.time === slot.value && booking.vehicle === vehicle,
      )
      return !isBooked
    })
  }

  // Get available time slots for flights
  const getAvailableFlightSlots = (date: string, flightType: string, flightValue: string) => {
    // Check date restrictions for helicopter flights
    if (flightValue === "schnupperflug-helikopter" && date !== "17.05.2025") {
      return [] // Schnupperflug Helikopter only available on 17.05.2025
    }

    if (flightValue === "erlebnisflug-helikopter" && date !== "18.05.2025") {
      return [] // Erlebnisflug Helikopter only available on 18.05.2025
    }

    if (flightType === "tandem") {
      // For tandem flights, use predefined slots
      const tandemSlots = TANDEM_SLOTS[date as keyof typeof TANDEM_SLOTS] || []

      // Filter out slots that already have 4 bookings
      return tandemSlots
        .filter((time) => {
          const bookingsForSlot = BOOKINGS.filter((b) => b.date === date && b.time === time && b.flight === flightValue)
          const totalBookings = bookingsForSlot.reduce((sum, b) => sum + (b.count || 1), 0)
          return totalBookings < 4
        })
        .map((time) => ({ value: time, label: time }))
    } else if (flightType === "helicopter") {
      // For helicopter experience flights, check if slots are available (max 3 per slot)
      return REGULAR_TIME_SLOTS.filter((slot) => {
        // Check if this slot is blocked by tandem flights (2 hour window)
        const isBlockedByTandem = BOOKINGS.some((booking) => {
          if (booking.date !== date || !booking.flight) return false

          const tandemFlight = FLIGHTS.find((f) => f.value === booking.flight)
          if (tandemFlight?.type !== "tandem") return false

          // Check if this slot is within 2 hours of a tandem flight
          const bookingHour = Number.parseInt(booking.time.split(":")[0])
          const bookingMinute = Number.parseInt(booking.time.split(":")[1])
          const slotHour = Number.parseInt(slot.value.split(":")[0])
          const slotMinute = Number.parseInt(slot.value.split(":")[1])

          const bookingTimeInMinutes = bookingHour * 60 + bookingMinute
          const slotTimeInMinutes = slotHour * 60 + slotMinute

          return Math.abs(bookingTimeInMinutes - slotTimeInMinutes) < 120
        })

        if (isBlockedByTandem) return false

        // Check if this slot already has 3 bookings for helicopter experience flights
        const bookingsForSlot = BOOKINGS.filter(
          (b) => b.date === date && b.time === slot.value && b.flight === flightValue,
        )
        const totalBookings = bookingsForSlot.reduce((sum, b) => sum + (b.count || 1), 0)

        return totalBookings < 3
      })
    } else {
      // For regular flights, check if the slot is available
      return REGULAR_TIME_SLOTS.filter((slot) => {
        // Check if this slot is already booked
        const isBooked = BOOKINGS.some(
          (booking) => booking.date === date && booking.time === slot.value && booking.flight === flightValue,
        )

        return !isBooked
      })
    }
  }

  // Check if a flight is available on the selected date
  const isFlightAvailableOnDate = (flightValue: string, date: string) => {
    if (flightValue === "schnupperflug-helikopter" && date !== "17.05.2025") {
      return false
    }
    if (flightValue === "erlebnisflug-helikopter" && date !== "18.05.2025") {
      return false
    }
    return true
  }

  const steps = [
    {
      id: "experience",
      name: "Erlebnis",
      icon: bookingType === "vehicle" ? <CarIcon className="h-5 w-5" /> : <PlaneTakeoffIcon className="h-5 w-5" />,
      fields: bookingType === "vehicle" ? ["vehicle"] : ["flight"],
    },
    {
      id: "schedule",
      name: "Termin",
      icon: <CalendarIcon className="h-5 w-5" />,
      fields: ["date", "time"],
    },
    {
      id: "contact",
      name: "Kontakt",
      icon: <UserIcon className="h-5 w-5" />,
      fields: ["firstName", "lastName", "street", "postalCode", "city", "birthDate", "email"],
    },
  ]

  function onSubmit(values: z.infer<typeof formSchema>) {
  console.log(values)

  const newBooking: Booking = {
    type: values.type,
    date: values.date,
    time: values.time,
  }

  if (values.type === "vehicle" && values.vehicle) {
    newBooking.vehicle = values.vehicle
  } else if (values.type === "flight" && values.flight) {
    newBooking.flight = values.flight

    const flightType = FLIGHTS.find((f) => f.value === values.flight)?.type
    if (flightType === "tandem") {
      newBooking.count = 1
    } else if (flightType === "helicopter" && values.flight.includes("erlebnisflug")) {
      newBooking.count = 1
    }
  }

  BOOKINGS.push(newBooking)

  // ➤ Hier wird an Google Sheets geschickt + Bestätigungsmail versendet
  fetch("https://script.google.com/macros/s/AKfycbxnxy-Y9GgffR8m94Z1B8M_DLOp2o6fctKuYjGETvaBS5JivkzPY6FzFHLM2oLRAYQc/exec", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fahrzeug: values.vehicle ?? "",
      flugart: values.flight ?? "",
      datum: values.date,
      uhrzeit: values.time,
      vorname: values.firstName,
      nachname: values.lastName,
      strasse: values.street,
      plz: values.postalCode,
      ort: values.city,
      geburtsdatum: values.birthDate,
      email: values.email,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("Antwort vom Google Script:", data)
      if (data.status === "success") {
        setSubmitted(true)
      } else {
        alert("Fehler: " + data.message)
      }
    })
    .catch((err) => {
      console.error("Fehler beim Absenden:", err)
      alert("Es gab ein Problem beim Absenden deiner Buchung.")
    })
}


  const validateCurrentStep = async () => {
    const currentFields = steps[currentStep].fields
    const result = await form.trigger(currentFields as any)
    return result
  }

  const goToNextStep = async () => {
    const isValid = await validateCurrentStep()
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
    }
  }

  const goToPreviousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const handleSubmit = async () => {
    const isValid = await validateCurrentStep()
    if (isValid) {
      form.handleSubmit(onSubmit)()
    }
  }

  const isTandemFlight = (flightValue: string) => {
    return flightValue.includes("tandemflug")
  }

  const isFendtTractor = (vehicleValue: string) => {
    return vehicleValue.includes("fendt")
  }

  const isMotorcycle = (vehicleValue: string) => {
    return vehicleValue === "schraeglagenmotorrad"
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#8BBE23" }}>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {submitted ? (
          <SuccessCard
            onReset={() => {
              form.reset()
              setSubmitted(false)
              setCurrentStep(0)
              setSelectedVehicle("")
              setSelectedFlight("")
              setSelectedDate("")
            }}
          />
        ) : (
          <>
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold text-white mb-4">Erlebnisbuchung</h1>
              <p className="text-white text-lg max-w-2xl mx-auto">
                Bei unserem Jubiläumsfest hast du die einzigartige Möglichkeit verschiedene Fahrzeuge und aufregende
                Rundflüge mit Flugzeugen und Helikoptern zu erleben - und das ohne Führerausweis. Verpasse die Chance
                nicht und buche gleich dein Wunscherlebnis.
              </p>
            </div>

            <Tabs
              defaultValue="vehicle"
              className="w-full"
              onValueChange={(value) => {
                setBookingType(value)
                form.setValue("type", value)
                // Reset related fields when changing booking type
                if (value === "vehicle") {
                  form.setValue("flight", undefined)
                  setSelectedFlight("")
                } else {
                  form.setValue("vehicle", undefined)
                  setSelectedVehicle("")
                }
                // Also reset date and time
                form.setValue("date", "")
                form.setValue("time", "")
                setSelectedDate("")
              }}
            >
              <TabsList className="grid w-full grid-cols-2 mb-8 p-1 h-auto">
                <TabsTrigger value="vehicle" className="text-lg py-4 px-6 rounded-md flex items-center justify-center">
                  <CarIcon className="mr-2 h-5 w-5" />
                  Probefahrt
                </TabsTrigger>
                <TabsTrigger value="flight" className="text-lg py-4 px-6 rounded-md flex items-center justify-center">
                  <PlaneTakeoffIcon className="mr-2 h-5 w-5" />
                  Flüge
                </TabsTrigger>
              </TabsList>

              <Card className="border-none shadow-lg">
                <CardHeader className="bg-white rounded-t-lg">
                  <CardTitle className="text-2xl">
                    {bookingType === "vehicle" ? "Probefahrt buchen" : "Flugerlebnis buchen"}
                  </CardTitle>
                  <CardDescription>
                    {bookingType === "vehicle"
                      ? "Wählen Sie Ihr Wunschfahrzeug und einen passenden Termin."
                      : "Wählen Sie Ihren Wunschflug und einen passenden Termin."}
                  </CardDescription>
                </CardHeader>

                {/* Progress Steps */}
                <div className="px-6 pt-2 bg-white">
                  <div className="flex items-center justify-between mb-6">
                    {steps.map((step, index) => (
                      <div key={step.id} className="flex flex-col items-center">
                        <div
                          className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-full border-2 mb-2",
                            currentStep === index
                              ? "border-primary bg-primary text-white"
                              : currentStep > index
                                ? "border-primary bg-primary/20 text-primary"
                                : "border-gray-300 text-gray-400",
                          )}
                        >
                          {step.icon}
                        </div>
                        <span
                          className={cn(
                            "text-sm font-medium",
                            currentStep === index
                              ? "text-primary"
                              : currentStep > index
                                ? "text-primary/80"
                                : "text-gray-400",
                          )}
                        >
                          {step.name}
                        </span>

                        {/* Connector line */}
                        {index < steps.length - 1 && (
                          <div className="hidden sm:block absolute left-0 w-full h-0.5 bg-gray-200 top-5 -z-10"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <CardContent className="pt-2 bg-white">
                  <Form {...form}>
                    <form className="space-y-6">
                      <input type="hidden" {...form.register("type")} value={bookingType} />

                      {/* Step 1: Experience Selection */}
                      {currentStep === 0 && (
                        <div className="space-y-6">
                          {bookingType === "vehicle" ? (
                            <>
                              <FormField
                                control={form.control}
                                name="vehicle"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Fahrzeug</FormLabel>
                                    <Select
                                      onValueChange={(value) => {
                                        field.onChange(value)
                                        setSelectedVehicle(value)
                                      }}
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Fahrzeug auswählen" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent className="max-h-[300px]">
                                        {VEHICLES.map((vehicle) => (
                                          <SelectItem key={vehicle.value} value={vehicle.value}>
                                            {vehicle.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              {selectedVehicle && (
                                <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
                                  <div className="flex items-start">
                                    <InfoIcon className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                                    <div>
                                      <h4 className="font-medium text-amber-800 mb-2">Wichtig:</h4>
                                      <ul className="space-y-1 text-sm text-amber-700 list-disc pl-5">
                                        {isFendtTractor(selectedVehicle) ? (
                                          <>
                                            <li>Mindestalter 12 Jahre</li>
                                            <li>Unter Alkohol oder Drogeneinfluss darf nicht gefahren werden</li>
                                          </>
                                        ) : isMotorcycle(selectedVehicle) ? (
                                          <>
                                            <li>Mindestalter 14 Jahre</li>
                                            <li>Unter Alkohol oder Drogeneinfluss darf nicht gefahren werden</li>
                                          </>
                                        ) : (
                                          <>
                                            <li>Mindestalter 14 Jahre</li>
                                            <li>Unter Alkohol oder Drogeneinfluss darf nicht gefahren werden</li>
                                            <li>Kinder (bis 14 Jahre) dürfen bei den Erwachsenen mitfahren</li>
                                          </>
                                        )}
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <FormField
                                control={form.control}
                                name="flight"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Flugart</FormLabel>
                                    <Select
                                      onValueChange={(value) => {
                                        field.onChange(value)
                                        setSelectedFlight(value)
                                      }}
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Flugart auswählen" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent className="max-h-[300px]">
                                        {FLIGHTS.map((flight) => (
                                          <SelectItem key={flight.value} value={flight.value}>
                                            {flight.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              {selectedFlight && !selectedDate && (
                                <div className="text-sm text-gray-500 mt-1">
                                  {selectedFlight === "schnupperflug-helikopter" &&
                                    "Hinweis: Schnupperflug Helikopter ist nur am 17.05.2025 verfügbar."}
                                  {selectedFlight === "erlebnisflug-helikopter" &&
                                    "Hinweis: Erlebnisflug Helikopter ist nur am 18.05.2025 verfügbar."}
                                </div>
                              )}

                              {selectedFlight && (
                                <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
                                  <div className="flex items-start">
                                    <InfoIcon className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                                    <div>
                                      {isTandemFlight(selectedFlight) ? (
                                        <>
                                          <h4 className="font-medium text-amber-800 mb-2">Tandemflug</h4>
                                          <ul className="space-y-1 text-sm text-amber-700 list-disc pl-5">
                                            <li>Mindestalter 12 Jahre</li>
                                            <li>Max. Gewicht 100 Kg</li>
                                            <li>Mind. leichte Turnschuhe</li>
                                            <li>Es können max. 4 Personen pro Flug teilnehmen</li>
                                          </ul>
                                        </>
                                      ) : (
                                        <>
                                          <h4 className="font-medium text-amber-800 mb-2">Mindestalter</h4>
                                          <ul className="space-y-1 text-sm text-amber-700 list-disc pl-5">
                                            <li>Kein Mindestalter</li>
                                          </ul>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {/* Step 2: Date and Time Selection */}
                      {currentStep === 1 && (
                        <div className="space-y-6">
                          <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Datum</FormLabel>
                                <Select
                                  onValueChange={(value) => {
                                    field.onChange(value)
                                    setSelectedDate(value)
                                    // Reset time when date changes
                                    form.setValue("time", "")
                                  }}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Datum auswählen" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {DATES.map((date) => (
                                      <SelectItem key={date.value} value={date.value}>
                                        {date.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="time"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Uhrzeit</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  disabled={!selectedDate || availableTimeSlots.length === 0}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue
                                        placeholder={
                                          !selectedDate
                                            ? "Bitte zuerst Datum wählen"
                                            : availableTimeSlots.length === 0
                                              ? "Keine Zeitslots verfügbar"
                                              : "Uhrzeit auswählen"
                                        }
                                      />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="max-h-[200px]">
                                    {availableTimeSlots.map((slot) => (
                                      <SelectItem key={slot.value} value={slot.value}>
                                        {slot.label} Uhr
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      {/* Step 3: Contact Information */}
                      {currentStep === 2 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Vorname</FormLabel>
                                <FormControl>
                                  <Input placeholder="Max" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nachname</FormLabel>
                                <FormControl>
                                  <Input placeholder="Mustermann" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="street"
                            render={({ field }) => (
                              <FormItem className="col-span-2">
                                <FormLabel>Strasse und Nr.</FormLabel>
                                <FormControl>
                                  <Input placeholder="Musterstrasse 123" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="postalCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>PLZ</FormLabel>
                                <FormControl>
                                  <Input placeholder="12345" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ort</FormLabel>
                                <FormControl>
                                  <Input placeholder="Musterstadt" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="birthDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Geburtsdatum</FormLabel>
                                <FormControl>
                                  <Input placeholder="TT.MM.JJJJ" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>E-Mail</FormLabel>
                                <FormControl>
                                  <Input placeholder="max.mustermann@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </form>
                  </Form>
                </CardContent>

                <CardFooter className="flex flex-col bg-white rounded-b-lg py-6">
                  <div className="flex justify-between w-full mb-6">
                    <Button
                      variant="outline"
                      onClick={goToPreviousStep}
                      disabled={currentStep === 0}
                      className="flex items-center"
                    >
                      <ChevronLeftIcon className="mr-2 h-4 w-4" />
                      Zurück
                    </Button>

                    {currentStep < steps.length - 1 ? (
                      <Button onClick={goToNextStep} className="flex items-center">
                        Weiter
                        <ChevronRightIcon className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button onClick={handleSubmit} className="flex items-center">
                        Buchung absenden
                        <CheckIcon className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Company Contact Information */}
                  <div className="text-sm text-gray-500 border-t pt-4 w-full flex flex-col sm:flex-row sm:justify-center gap-4">
                    <div className="flex items-center">
                      <PhoneIcon className="h-4 w-4 mr-2" />
                      <span>079 274 22 25</span>
                    </div>
                    <div className="flex items-center">
                      <MailIcon className="h-4 w-4 mr-2" />
                      <a href="mailto:10jahre@freshup.ch" className="hover:underline">
                        10jahre@freshup.ch
                      </a>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </Tabs>
          </>
        )}
      </div>
    </div>
  )
}

function SuccessCard({ onReset }: { onReset: () => void }) {
  return (
    <Card className="border-none shadow-lg max-w-md mx-auto mt-20">
      <CardHeader className="bg-green-100 rounded-t-lg">
        <div className="mx-auto bg-green-600 w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <CheckIcon className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-2xl text-center">Buchung erfolgreich!</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 bg-white text-center">
        <p className="mb-6">Vielen Dank für Ihre Buchung. Wir haben Ihnen eine Bestätigungs-E-Mail gesendet.</p>
      </CardContent>
      <CardFooter className="bg-white rounded-b-lg flex justify-center pb-6">
        <Button onClick={onReset} variant="outline">
          Neue Buchung erstellen
        </Button>
      </CardFooter>
    </Card>
  )
}

