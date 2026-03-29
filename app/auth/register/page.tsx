'use client'

import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { AlertCircle, Heart, ImagePlus, LocateFixed, MapPin } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const registerSchema = z.object({
  role: z.enum(['patient', 'staff', 'healthcenter']),
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(8, 'Phone is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm your password'),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  bloodType: z.string().optional(),
  staffId: z.string().optional(),
  departmentName: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  healthCenterName: z.string().optional(),
  healthCenterType: z.string().optional(),
  website: z.string().optional(),
  registrationNumber: z.string().optional(),
  licenseNumber: z.string().optional(),
  licenseExpiry: z.string().optional(),
  contactPersonName: z.string().optional(),
  contactPersonRole: z.string().optional(),
  contactPersonPhone: z.string().optional(),
  services: z.string().optional(),
  specializations: z.string().optional(),
  requiredNeeds: z.string().optional(),
}).superRefine((values, ctx) => {
  if (values.password !== values.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['confirmPassword'],
      message: 'Passwords do not match',
    })
  }

  if (values.role === 'staff' && !values.staffId?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['staffId'],
      message: 'Staff ID is required',
    })
  }

  if (values.role === 'healthcenter') {
    ;['healthCenterName', 'healthCenterType', 'contactPersonName', 'address', 'city', 'state'].forEach((field) => {
      if (!String(values[field as keyof typeof values] || '').trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: 'This field is required',
        })
      }
    })
  }
})

type RegisterValues = z.infer<typeof registerSchema>

const defaultValues: RegisterValues = {
  role: 'patient',
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  dateOfBirth: '',
  gender: 'other',
  bloodType: '',
  staffId: '',
  departmentName: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  latitude: '',
  longitude: '',
  healthCenterName: '',
  healthCenterType: 'clinic',
  website: '',
  registrationNumber: '',
  licenseNumber: '',
  licenseExpiry: '',
  contactPersonName: '',
  contactPersonRole: '',
  contactPersonPhone: '',
  services: '',
  specializations: '',
  requiredNeeds: '',
}

const stepFields: Record<string, (keyof RegisterValues)[][]> = {
  patient: [
    ['role', 'name', 'email', 'phone', 'password', 'confirmPassword'],
    ['dateOfBirth', 'gender', 'bloodType'],
    ['address', 'city', 'state', 'zipCode'],
    [],
  ],
  staff: [
    ['role', 'name', 'email', 'phone', 'password', 'confirmPassword'],
    ['staffId', 'departmentName'],
    ['address', 'city', 'state', 'zipCode'],
    [],
  ],
  healthcenter: [
    ['role', 'name', 'email', 'phone', 'password', 'confirmPassword'],
    ['healthCenterName', 'healthCenterType', 'contactPersonName', 'contactPersonRole', 'contactPersonPhone', 'website'],
    ['address', 'city', 'state', 'zipCode', 'registrationNumber', 'licenseNumber', 'licenseExpiry', 'services', 'specializations', 'requiredNeeds'],
    [],
  ],
}

const stepLabels: Record<string, string[]> = {
  patient: ['Account', 'Profile', 'Location', 'Review'],
  staff: ['Account', 'Staff', 'Location', 'Review'],
  healthcenter: ['Owner', 'Center', 'Compliance', 'Review'],
}

export default function RegisterPage() {
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues,
    mode: 'onBlur',
  })

  const role = form.watch('role')
  const steps = stepLabels[role]
  const progress = ((step + 1) / steps.length) * 100

  const reviewItems = useMemo(() => {
    const values = form.getValues()
    if (role === 'healthcenter') {
      return [
        ['Owner', values.name],
        ['Center', values.healthCenterName],
        ['Type', values.healthCenterType],
        ['Contact', values.contactPersonName],
        ['Address', [values.address, values.city, values.state, values.zipCode].filter(Boolean).join(', ')],
        ['Needs', values.requiredNeeds],
      ]
    }
    return [
      ['Name', values.name],
      ['Email', values.email],
      ['Role', values.role],
      ['Phone', values.phone],
      ['Location', [values.address, values.city, values.state, values.zipCode].filter(Boolean).join(', ')],
    ]
  }, [form, role])

  const nextStep = async () => {
    const valid = await form.trigger(stepFields[role][step])
    if (valid) {
      setStep((current) => Math.min(current + 1, steps.length - 1))
    }
  }

  const previousStep = () => setStep((current) => Math.max(current - 1, 0))

  const fillFromCoordinates = async (latitude: number, longitude: number) => {
    form.setValue('latitude', String(latitude))
    form.setValue('longitude', String(longitude))

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error('Reverse geocoding failed')
    }

    const data = await response.json()
    const address = data.address || {}

    form.setValue('address', data.display_name || '')
    form.setValue('city', address.city || address.town || address.village || '')
    form.setValue('state', address.state || '')
    form.setValue('zipCode', address.postcode || '')
  }

  const detectLocation = async () => {
    setError('')
    setLocating(true)

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported in this browser')
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
        })
      })

      await fillFromCoordinates(position.coords.latitude, position.coords.longitude)
    } catch (err: any) {
      setError(err.message || 'Could not detect your location')
    } finally {
      setLocating(false)
    }
  }

  const onSubmit = async (values: RegisterValues) => {
    setError('')
    setLoading(true)

    try {
      const payload = new FormData()
      Object.entries(values).forEach(([key, value]) => {
        payload.append(key, value || '')
      })

      if (imageFile) {
        payload.append('image', imageFile)
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        body: payload,
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed')
      }

      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user))
      }

      window.location.href = '/auth/login'
    } catch (err: any) {
      setError(err.message || 'Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 p-4">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center py-10">
        <Card className="w-full overflow-hidden border-border/50 shadow-2xl">
          <div className="grid lg:grid-cols-[320px,1fr]">
            <div className="bg-gradient-to-br from-primary to-secondary p-8 text-primary-foreground">
              <div className="mb-8 flex items-center gap-3">
                <Heart className="h-10 w-10 fill-current" />
                <div>
                  <p className="text-2xl font-bold">VoiceCare AI</p>
                  <p className="text-sm text-primary-foreground/80">Role-aware onboarding</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-primary-foreground/70">Registration</p>
                  <h1 className="mt-2 text-3xl font-bold leading-tight">
                    {role === 'healthcenter' ? 'Register your health center' : 'Create your account'}
                  </h1>
                  <p className="mt-3 text-sm text-primary-foreground/80">
                    Doctors do not self-register here. Their login is created by the hospital or health center that adds them to the platform.
                  </p>
                </div>

                <Progress value={progress} className="bg-white/20" />

                <div className="space-y-3">
                  {steps.map((label, index) => (
                    <div
                      key={label}
                      className={`rounded-2xl border px-4 py-3 ${
                        index === step
                          ? 'border-white/40 bg-white/15'
                          : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <p className="text-xs uppercase tracking-[0.25em] text-primary-foreground/60">Step {index + 1}</p>
                      <p className="mt-1 font-semibold">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 lg:p-10">
              {error && (
                <div className="mb-6 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {step === 0 && (
                    <div className="grid gap-5 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Register As</FormLabel>
                            <FormControl>
                              <select
                                {...field}
                                className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                              >
                                <option value="patient">Patient</option>
                                <option value="staff">Healthcare Staff</option>
                                <option value="healthcenter">Health Center</option>
                              </select>
                            </FormControl>
                            <FormDescription>
                              Health centers will be created in pending state until staff approval.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {['name', 'email', 'phone', 'password', 'confirmPassword'].map((name) => (
                        <FormField
                          key={name}
                          control={form.control}
                          name={name as keyof RegisterValues}
                          render={({ field }) => (
                            <FormItem className={name === 'name' ? 'md:col-span-2' : ''}>
                              <FormLabel>
                                {name === 'name' ? 'Full Name' : name === 'email' ? 'Email' : name === 'phone' ? 'Phone Number' : name === 'password' ? 'Password' : 'Confirm Password'}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type={name.toLowerCase().includes('password') ? 'password' : name === 'email' ? 'email' : 'text'}
                                  placeholder={
                                    name === 'name'
                                      ? 'Jane Doe'
                                      : name === 'email'
                                        ? 'name@example.com'
                                        : name === 'phone'
                                          ? '+91 98765 43210'
                                          : '••••••••'
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  )}

                  {step === 1 && role === 'patient' && (
                    <div className="grid gap-5 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <FormControl>
                              <select {...field} className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
                                <option value="female">Female</option>
                                <option value="male">Male</option>
                                <option value="other">Other</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bloodType"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Blood Type</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="O+, A-, AB+" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {step === 1 && role === 'staff' && (
                    <div className="grid gap-5 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="staffId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Staff Member ID</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="STF-2031" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="departmentName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Cardiology" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {step === 1 && role === 'healthcenter' && (
                    <div className="grid gap-5 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="healthCenterName"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Health Center Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Sanjeevani Community Health Center" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="healthCenterType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Center Type</FormLabel>
                            <FormControl>
                              <select {...field} className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
                                <option value="hospital">Hospital</option>
                                <option value="uhc">UHC</option>
                                <option value="clinic">Clinic</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://example.org" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="contactPersonName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Person</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Dr. Priya Rao" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="contactPersonRole"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Role</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Administrator" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="contactPersonPhone"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Contact Phone</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="+91 90000 00000" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-5">
                      <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div className="flex items-start gap-3">
                            <MapPin className="mt-1 h-5 w-5 text-primary" />
                            <div>
                              <p className="font-semibold">Use current location</p>
                              <p className="text-sm text-muted-foreground">
                                We will detect coordinates with the navigator API and fill the address from OpenStreetMap.
                              </p>
                            </div>
                          </div>
                          <Button type="button" variant="outline" onClick={detectLocation} disabled={locating} className="gap-2">
                            <LocateFixed className="h-4 w-4" />
                            {locating ? 'Detecting...' : 'Detect My Location'}
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Address</FormLabel>
                              <FormControl>
                                <Textarea {...field} placeholder="Street address or full place description" rows={3} />
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
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Bengaluru" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Karnataka" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="zipCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Zip Code</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="560001" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="latitude"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Latitude</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="12.9716" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="longitude"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Longitude</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="77.5946" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {role === 'healthcenter' && (
                        <div className="grid gap-5 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="registrationNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Registration Number</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="REG-00992" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="licenseNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>License Number</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="LIC-55012" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="licenseExpiry"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>License Expiry</FormLabel>
                                <FormControl>
                                  <Input {...field} type="date" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Center Image</p>
                            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-dashed border-input px-4 py-3 text-sm">
                              <ImagePlus className="h-4 w-4 text-primary" />
                              <span>{imageFile ? imageFile.name : 'Upload building or facility image'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(event) => {
                                  const file = event.target.files?.[0] || null
                                  setImageFile(file)
                                  setImagePreview(file ? URL.createObjectURL(file) : '')
                                }}
                              />
                            </label>
                            {imagePreview && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={imagePreview} alt="Health center preview" className="h-32 w-full rounded-xl object-cover" />
                            )}
                          </div>
                          <FormField
                            control={form.control}
                            name="services"
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>Services</FormLabel>
                                <FormControl>
                                  <Textarea {...field} placeholder="Outpatient care, maternal care, emergency triage" rows={3} />
                                </FormControl>
                                <FormDescription>Use commas to separate multiple services.</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="specializations"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Specializations</FormLabel>
                                <FormControl>
                                  <Textarea {...field} placeholder="General medicine, pediatrics, orthopedics" rows={3} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="requiredNeeds"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Care Needs Covered</FormLabel>
                                <FormControl>
                                  <Textarea {...field} placeholder="fever, pregnancy support, wound care, respiratory issues" rows={3} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-5">
                      <div className="rounded-3xl border border-border/60 bg-muted/20 p-6">
                        <h3 className="text-xl font-bold">Review your details</h3>
                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                          {reviewItems.map(([label, value]) => (
                            <div key={label} className="rounded-2xl border border-border/60 bg-background p-4">
                              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
                              <p className="mt-1 font-medium">{value || 'Not provided'}</p>
                            </div>
                          ))}
                        </div>
                        {role === 'healthcenter' && (
                          <p className="mt-5 text-sm text-muted-foreground">
                            After registration, the center owner can log in immediately and view the pending approval status while staff review the application.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-muted-foreground">
                      Already have an account?{' '}
                      <Link href="/auth/login" className="font-semibold text-primary hover:underline">
                        Sign in
                      </Link>
                    </div>

                    <div className="flex gap-3">
                      {step > 0 && (
                        <Button type="button" variant="outline" onClick={previousStep}>
                          Back
                        </Button>
                      )}
                      {step < steps.length - 1 ? (
                        <Button type="button" onClick={nextStep}>
                          Continue
                        </Button>
                      ) : (
                        <Button type="submit" disabled={loading}>
                          {loading ? 'Creating account...' : 'Create account'}
                        </Button>
                      )}
                    </div>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
