'use client'

import { useRouter } from 'next/navigation'

import { useAuth } from '@/components/auth/auth-provider'
import { PremiumPricingPlans } from '@/components/premium-pricing-plans'

export function PricingSection() {
  const router = useRouter()
  const { session, isLoading } = useAuth()

  return (
    <PremiumPricingPlans
      renderCta={(plan, context) => {
        const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
          e.preventDefault()
          if (isLoading) return
          
          if (session) {
            router.push(`/checkout?plan=${plan.id}`)
          } else {
            router.push(`/signup?redirect=/checkout&plan=${plan.id}`)
          }
        }

        return (
          <button
            type="button"
            onClick={handleClick}
            aria-label={context.ctaAriaLabel}
            className={context.buttonClassName}
            disabled={isLoading}
          >
            <span className="flex h-full items-center justify-center">{context.ctaLabel}</span>
          </button>
        )
      }}
    />
  )
}
