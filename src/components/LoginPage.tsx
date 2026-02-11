import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface LoginPageProps {
  onSignIn: (email: string, password: string) => Promise<{ error: Error | null }>
}

export function LoginPage({ onSignIn }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await onSignIn(email, password)
    if (error) {
      setError('Грешен имейл или парола')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-[360px]">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Сметки</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Имейл</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Парола</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Вход...' : 'Вход'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
