'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { ImagePlus, Sun, Download, RefreshCw } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"
import { useOpenCV } from '@/lib/useOpenCV'

interface ImageAdjusterState {
  image: string | null;
  displayImage: string | null;
  brightness: number;
  isProcessing: boolean;
}

export default function ImageAdjuster() {
  const [state, setState] = useState<ImageAdjusterState>({
    image: null,
    displayImage: null,
    brightness: 0,
    isProcessing: false,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const originalImageRef = useRef<string | null>(null);
  const { toast } = useToast();
  const isOpenCVLoaded = useOpenCV();

  const adjustBrightness = useCallback(() => {
    if (!state.image || !isOpenCVLoaded || !canvasRef.current || !imageRef.current) return;

    setState(prev => ({ ...prev, isProcessing: true }));

    const img = new Image();
    img.onload = () => {
      try {
        const mat = window.cv.imread(img);
        const adjustedMat = new window.cv.Mat();
        
        mat.convertTo(adjustedMat, -1, 1, state.brightness);
        
        window.cv.imshow(canvasRef.current!, adjustedMat);
        
        const adjustedImageDataUrl = canvasRef.current!.toDataURL('image/png');
        setState(prev => ({ ...prev, displayImage: adjustedImageDataUrl, isProcessing: false }));

        mat.delete();
        adjustedMat.delete();
      } catch (error) {
        console.error("Error adjusting brightness:", error);
        toast({
          title: "Error",
          description: "Failed to adjust image brightness. Please try again.",
          variant: "destructive",
        });
        setState(prev => ({ ...prev, isProcessing: false }));
      }
    };
    img.src = state.image;
  }, [state.image, state.brightness, isOpenCVLoaded, toast]);

  useEffect(() => {
    if (isOpenCVLoaded && state.image) {
      adjustBrightness();
    }
  }, [isOpenCVLoaded, state.image, state.brightness, adjustBrightness]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageDataUrl = event.target?.result as string;
        setState(prev => ({
          ...prev,
          image: imageDataUrl,
          displayImage: imageDataUrl,
          brightness: 0,
        }));
        originalImageRef.current = imageDataUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        const link = document.createElement('a');
        link.download = 'adjusted-image.png';
        
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            link.href = url;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);

            toast({
              title: "Download Started",
              description: "Your adjusted image is being downloaded.",
            });
          } else {
            throw new Error("Failed to create image blob");
          }
        }, 'image/png');
      } catch (error) {
        console.error("Download failed:", error);
        toast({
          title: "Download Failed",
          description: "There was an error downloading your image. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "No Image to Download",
        description: "Please adjust an image before downloading.",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    if (originalImageRef.current) {
      setState(prev => ({
        ...prev,
        image: originalImageRef.current,
        displayImage: originalImageRef.current,
        brightness: 0,
      }));
    }
  };

  return (
    <Card className="max-w-md mx-auto bg-white/90 backdrop-blur-md shadow-xl rounded-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
        <CardTitle className="text-3xl font-bold text-center">Brightnessy</CardTitle>
        <CardDescription className="text-center text-blue-100">Set Your Brightness Images</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="flex items-center justify-center">
          <Label htmlFor="image-upload" className="cursor-pointer">
            <div className="w-64 h-64 border-4 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden group transition-all duration-300 ease-in-out hover:border-purple-500">
              {state.displayImage ? (
                <img src={state.displayImage} alt="Uploaded" className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="text-center">
                  <ImagePlus className="mx-auto h-16 w-16 text-gray-400 group-hover:text-purple-500 transition-colors duration-300" />
                  <span className="mt-2 block text-sm font-medium text-gray-900 group-hover:text-purple-500 transition-colors duration-300">
                    Upload an image
                  </span>
                </div>
              )}
            </div>
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </Label>
        </div>
        {state.image && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Sun className="h-6 w-6 text-yellow-500" />
              <Label htmlFor="brightness" className="text-lg font-semibold">Brightness</Label>
            </div>
            <Slider
              id="brightness"
              min={-255}
              max={255}
              step={1}
              value={[state.brightness]}
              onValueChange={(value) => setState(prev => ({ ...prev, brightness: value[0] }))}
              className="w-full"
            />
            <div className="flex justify-between">
              <Button onClick={handleReset} variant="outline" className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4" />
                <span>Reset</span>
              </Button>
              <Button onClick={handleDownload} className="flex items-center space-x-2 bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white">
                <Download className="h-4 w-4" />
                <span>Download</span>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-gray-50 p-6">
        <canvas ref={canvasRef} className="w-full h-auto rounded-lg shadow-lg hidden" />
        <img ref={imageRef} src={state.image || undefined} className="hidden" alt="Original" />
      </CardFooter>
    </Card>
  )
}