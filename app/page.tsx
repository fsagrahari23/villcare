'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { Heart, Mic, MapPin, Brain, Users, Shield, ArrowRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="border-b border-border backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-8 h-8 text-primary fill-primary" />
            <span className="text-xl font-bold text-primary">VoiceCare AI</span>
          </div>
          <div className="flex gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Register</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div>
              <span className="inline-block px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium mb-4">
                🚀 Voice-First Healthcare
              </span>
              <h1 className="text-5xl md:text-6xl font-bold text-balance leading-tight">
                Medical Triage for <span className="text-primary">Everyone</span>
              </h1>
              <p className="text-xl text-muted-foreground mt-4 text-balance">
                Multilingual, voice-enabled medical triage platform designed for rural and low-literacy users. Get instant AI-powered health assessments.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth/register">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground group">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline">
                Watch Demo
              </Button>
            </div>
          </div>
          <div className="relative h-96 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl border border-border flex items-center justify-center">
            <div className="text-center space-y-4">
              <Mic className="w-24 h-24 text-primary mx-auto opacity-50" />
              <p className="text-muted-foreground">Voice Input Interface</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-secondary/5 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why VoiceCare AI?</h2>
            <p className="text-xl text-muted-foreground text-balance">
              Designed specifically for rural healthcare with accessibility at its core
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Mic className="w-8 h-8" />,
                title: 'Voice-First Design',
                desc: 'Record symptoms in your native language. AI transcribes and analyzes instantly.'
              },
              {
                icon: <Brain className="w-8 h-8" />,
                title: 'AI Medical Analysis',
                desc: 'Gemini-powered analysis provides structured triage results and recommendations.'
              },
              {
                icon: <MapPin className="w-8 h-8" />,
                title: 'Location Aware',
                desc: 'Find nearby health centers within 5km radius with real-time status.'
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: 'Staff Dashboard',
                desc: 'Hospital admissions review and approval with document management.'
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: 'Secure & Private',
                desc: 'End-to-end encrypted, HIPAA-compliant health data management.'
              },
              {
                icon: <Heart className="w-8 h-8" />,
                title: 'Multilingual',
                desc: 'Support for Hindi, Tamil, English and more regional languages.'
              }
            ].map((feature, i) => (
              <Card key={i} className="p-6 hover:shadow-lg transition-shadow border-border/50">
                <div className="text-primary mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-bold mb-12 text-center">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: 1, title: 'Record', desc: 'Describe symptoms using voice' },
            { step: 2, title: 'Analyze', desc: 'AI processes your symptoms' },
            { step: 3, title: 'Locate', desc: 'Find nearby health centers' },
            { step: 4, title: 'Track', desc: 'Monitor and get recommendations' }
          ].map((item) => (
            <div key={item.step} className="relative">
              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </Card>
              {item.step < 4 && (
                <ArrowRight className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-secondary" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { number: '500+', label: 'Health Centers' },
              { number: '50K+', label: 'Patients Served' },
              { number: '98%', label: 'Accuracy' },
              { number: '24/7', label: 'Support' }
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-4xl font-bold">{stat.number}</p>
                <p className="text-primary-foreground/80 mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-4xl font-bold mb-6">Ready to Transform Rural Healthcare?</h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join thousands of healthcare providers and patients using VoiceCare AI for better medical outcomes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/register">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Sign Up Now
            </Button>
          </Link>
          <Button size="lg" variant="outline">
            Request Demo
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-6 h-6 text-primary fill-primary" />
                <span className="font-bold text-primary">VoiceCare AI</span>
              </div>
              <p className="text-sm text-muted-foreground">Healthcare for everyone</p>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Pricing', 'Security'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers'] },
              { title: 'Legal', links: ['Privacy', 'Terms', 'Contact'] }
            ].map((col, i) => (
              <div key={i}>
                <h4 className="font-semibold mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 VoiceCare AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
