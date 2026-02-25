import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

interface Step {
  targetId: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const steps: Step[] = [
  {
    targetId: 'new-chat-btn',
    title: 'New Chat',
    description: 'Start a fresh conversation anytime by clicking the New Chat button.',
    position: 'bottom'
  },
  {
    targetId: 'language-selector',
    title: 'Multi-language Support',
    description: 'Nexus AI supports multiple languages. Switch your preferred language here.',
    position: 'bottom'
  },
  {
    targetId: 'login-btn',
    title: 'Join Nexus',
    description: 'Login to save your conversations across devices and unlock personalized features.',
    position: 'bottom'
  },
  {
    targetId: 'chat-input',
    title: 'Start Chatting',
    description: 'Type your questions here to start a conversation with Nexus AI.',
    position: 'top'
  }
];

export function OnboardingTutorial() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const handleTrigger = () => {
      console.log("Tutorial trigger received");
      setCurrentStep(0);
      setIsVisible(true);
    };
    
    window.addEventListener('nexus-trigger-tutorial', handleTrigger);
    
    // Check if tutorial should show automatically
    const hasSeenTutorial = localStorage.getItem('nexus_tutorial_seen');
    if (!hasSeenTutorial) {
      const timer = setTimeout(() => {
        console.log("Showing initial tutorial");
        setIsVisible(true);
      }, 1500);
      return () => {
        window.removeEventListener('nexus-trigger-tutorial', handleTrigger);
        clearTimeout(timer);
      };
    }
    
    return () => window.removeEventListener('nexus-trigger-tutorial', handleTrigger);
  }, []);

  useEffect(() => {
    if (isVisible) {
      const element = document.getElementById(steps[currentStep].targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTargetRect(element.getBoundingClientRect());
      } else {
        console.warn(`Tutorial target element not found: ${steps[currentStep].targetId}`);
        // If first step fails, skip to next or just show something
        if (currentStep === 0 && steps.length > 1) {
          // Try to find any other step's element
          const nextElement = document.getElementById(steps[1].targetId);
          if (nextElement) {
            setCurrentStep(1);
          }
        }
      }
    }
  }, [isVisible, currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTutorial();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const completeTutorial = () => {
    setIsVisible(false);
    localStorage.setItem('nexus_tutorial_seen', 'true');
  };

  if (!isVisible || !targetRect) return null;

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Dimmed Background with Hole */}
      <div className="absolute inset-0 bg-black/60 transition-opacity duration-500" style={ {
        clipPath: `polygon(
          0% 0%, 0% 100%, 
          ${targetRect.left}px 100%, 
          ${targetRect.left}px ${targetRect.top}px, 
          ${targetRect.right}px ${targetRect.top}px, 
          ${targetRect.right}px ${targetRect.bottom}px, 
          ${targetRect.left}px ${targetRect.bottom}px, 
          ${targetRect.left}px 100%, 
          100% 100%, 100% 0%
        )`
      } } />

      {/* Animated Highlight Ring */}
      <motion.div
        initial={ { scale: 1.2, opacity: 0 } }
        animate={ { scale: 1, opacity: 1 } }
        key={`ring-${currentStep}`}
        className="absolute border-2 border-primary rounded-lg shadow-[0_0_20px_rgba(var(--primary),0.5)]"
        style={ {
          left: targetRect.left - 4,
          top: targetRect.top - 4,
          width: targetRect.width + 8,
          height: targetRect.height + 8,
        } }
      >
        <div className="absolute inset-0 animate-ping border border-primary rounded-lg opacity-40" />
      </motion.div>

      {/* Info Card */}
      <motion.div
        initial={ { y: 20, opacity: 0 } }
        animate={ { y: 0, opacity: 1 } }
        key={`card-${currentStep}`}
        className="absolute pointer-events-auto flex justify-center w-full px-4"
        style={ {
          left: 0,
          top: step.targetId === 'swipe-trigger' ? Math.max(window.innerHeight - 350, 20) :
               step.position === 'bottom' ? Math.min(targetRect.bottom + 20, window.innerHeight - 200) : 
               step.position === 'top' ? Math.max(targetRect.top - 200, 20) : 
               step.position === 'right' ? Math.max(targetRect.bottom + 20, 20) :
               Math.max(targetRect.top, 20),
          zIndex: 101
        } }
      >
        <Card className="p-4 border-primary/30 bg-background/95 backdrop-blur-md shadow-2xl relative overflow-hidden w-full max-w-[320px]">
          {step.targetId === 'swipe-trigger' && (
            <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-[-1]">
              <div className="flex flex-col items-center gap-8">
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: [0, 0.4, 0], y: [100, -200] }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 2, 
                      delay: i * 0.3,
                      ease: "linear"
                    }}
                    className="text-primary font-bold text-[120px] leading-none select-none"
                  >
                    ^
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-lg">{step.title}</h3>
          </div>
          
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            {step.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-4 bg-primary' : 'w-1.5 bg-primary/20'}`} 
                />
              ))}
            </div>
            
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={completeTutorial} className="h-8 text-muted-foreground hover:text-red-500">
              Skip
            </Button>
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={handleBack} className="h-8">
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            )}
            <Button size="sm" onClick={handleNext} className="h-8 shadow-lg shadow-primary/20">
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
              {currentStep < steps.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
