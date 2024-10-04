import { useState, useEffect } from 'react'

declare global {
  interface Window {
    cv: any;
  }
}

let openCVPromise: Promise<void> | null = null

function loadOpenCV(): Promise<void> {
  if (openCVPromise) {
    return openCVPromise
  }

  openCVPromise = new Promise<void>((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://docs.opencv.org/4.5.2/opencv.js'
    script.async = true
    script.onload = () => {
      if (window.cv) {
        resolve()
      } else {
        console.error('OpenCV.js loaded but cv object is not available')
      }
    }
    script.onerror = () => {
      console.error('Failed to load OpenCV.js')
    }
    document.body.appendChild(script)
  })

  return openCVPromise
}

export function useOpenCV() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    loadOpenCV().then(() => {
      setIsLoaded(true)
    })
  }, [])

  return isLoaded
}