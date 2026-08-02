import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  description?: string;
}

interface FormWizardProps {
  steps: Step[];
  currentStep: number;
  onStepChange: (step: number) => void;
  children: ReactNode;
  onPrev?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  canProceed?: boolean;
  isSubmitting?: boolean;
}

/**
 * FormWizard Component
 * Multi-step form navigation for admin forms
 */
export function FormWizard({
  steps,
  currentStep,
  onStepChange,
  children,
  onPrev,
  onNext,
  onSubmit,
  isFirstStep,
  isLastStep,
  canProceed = true,
  isSubmitting = false,
}: FormWizardProps) {
  return (
    <div className="space-y-8">
      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <button
                type="button"
                onClick={() => onStepChange(index)}
                disabled={index > currentStep}
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-colors
                  ${isActive ? 'bg-blue-600 text-white' : ''}
                  ${isCompleted ? 'bg-green-600 text-white' : ''}
                  ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-600' : ''}
                  ${index <= currentStep ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed opacity-50'}
                `}
              >
                {isCompleted ? <Check size={20} /> : index + 1}
              </button>

              {/* Step Info */}
              <div className="ml-3 flex-1">
                <p
                  className={`text-sm font-medium ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-600'
                  }`}
                >
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-xs text-gray-500">{step.description}</p>
                )}
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-4 ${
                    index < currentStep ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {children}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <div>
          {!isFirstStep && (
            <Button
              type="button"
              variant="outline"
              onClick={onPrev}
              disabled={isSubmitting}
            >
              Previous
            </Button>
          )}
        </div>

        <div className="flex gap-3">
          {!isLastStep && (
            <Button
              type="button"
              onClick={onNext}
              disabled={!canProceed || isSubmitting}
              className="btn-modern"
            >
              Next Step
            </Button>
          )}

          {isLastStep && (
            <Button
              type="button"
              onClick={onSubmit}
              disabled={!canProceed || isSubmitting}
              className="btn-modern"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Product'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
