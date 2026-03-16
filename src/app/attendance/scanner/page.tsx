'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useToast } from '@/components/ui/toast';
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, getDocs, Timestamp, doc, serverTimestamp } from 'firebase/firestore';
import type { User, AttendanceRecord } from '@/lib/types';
import { CameraOff, CheckCircle, XCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ManualCheckIn } from '@/components/attendance/manual-checkin';

const QrScanner = dynamic(() => import('react-qr-scanner'), { ssr: false });

import { useMultiTenant } from '@/providers/multi-tenant-provider';

export default function ScannerPage() {
  const [result, setResult] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ userId: string; timestamp: number } | null>(null);
  const [scannedUser, setScannedUser] = useState<User | null>(null);
  const [status, setStatus] = useState<'success_in' | 'success_out' | 'error' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const firestore = useFirestore();
  const { toast } = useToast();
  const { activeComedorId } = useMultiTenant();
  const [hasCamera, setHasCamera] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  const handleScan = async (data: any) => {
    if (data) {
      // Handle both object { text: string } and direct string results
      const scannedText = typeof data === 'object' && data.text ? data.text : (typeof data === 'string' ? data : null);

      if (!scannedText) return;

      const now = Date.now();
      // Debounce: prevent re-scanning the same code within 3 seconds
      if (lastResult && lastResult.userId === scannedText && (now - lastResult.timestamp) < 3000) {
        return;
      }

      console.log("Scanned text:", scannedText);
      setResult(scannedText);
      setLastResult({ userId: scannedText, timestamp: now });
    }
  };

  const handleError = (err: any) => {
    // Some non-critical errors (like "Permission denied" being dismissed) shouldn't break the UI
    console.error("QR Scanner Error:", err);

    // Only set hasCamera to false if it's a persistent error
    if (err && (err.name === 'NotAllowedError' || err.name === 'NotFoundError')) {
      if (hasCamera) {
        setHasCamera(false);
        toast({
          variant: 'destructive',
          title: 'Error de Cámara',
          description: 'No se pudo acceder a la cámara. Revisa los permisos del navegador o asegúrate de usar HTTPS.',
        });
      }
    }
  };

  useEffect(() => {
    const processScan = async () => {
      if (!result || !firestore) return;

      try {
        const userQuery = activeComedorId
          ? query(collection(firestore, 'users'), where('id', '==', result), where('comedorId', '==', activeComedorId))
          : query(collection(firestore, 'users'), where('id', '==', result));

        const userSnap = await getDocs(userQuery);

        if (userSnap.empty) {
          setStatus('error');
          setMessage('Usuario no encontrado en esta sede.');
          setScannedUser(null);
          return;
        }

        const user = { id: userSnap.docs[0].id, ...userSnap.docs[0].data() } as User;
        setScannedUser(user);

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const attendanceQuery = query(
          collection(firestore, 'attendance'),
          where('userId', '==', result),
          where('checkIn', '>=', Timestamp.fromDate(todayStart)),
          where('checkIn', '<=', Timestamp.fromDate(todayEnd))
        );

        const attendanceSnap = await getDocs(attendanceQuery);

        if (attendanceSnap.empty) {
          const newRecord: Omit<AttendanceRecord, 'id'> = {
            userId: result,
            comedorId: activeComedorId || user.comedorId || 'unknown',
            checkIn: serverTimestamp() as any, // Cast to any to bypass Timestamp vs FieldValue lint
            status: new Date().getHours() > 8 ? 'retardo' : 'presente',
          };
          addDocumentNonBlocking(collection(firestore, 'attendance'), newRecord);
          setStatus('success_in');
          setMessage(`Entrada registrada a las ${format(new Date(), 'HH:mm')}`);
        } else {
          const recordToUpdate = attendanceSnap.docs[0];
          if (!recordToUpdate.data().checkOut) { // Only update if checkOut is not set
            updateDocumentNonBlocking(doc(firestore, 'attendance', recordToUpdate.id), {
              checkOut: serverTimestamp(),
            });
            setStatus('success_out');
            setMessage(`Salida registrada a las ${format(new Date(), 'HH:mm')}`);
          } else {
            setStatus('error');
            setMessage('Ya se ha registrado una salida para hoy.');
          }
        }

      } catch (error) {
        console.error("Error processing scan:", error);
        setStatus('error');
        setMessage('Ocurrió un error al procesar el registro.');
        setScannedUser(null);
      } finally {
        setTimeout(() => {
          setResult(null);
          setStatus(null);
          setMessage(null);
          setScannedUser(null);
        }, 3000);
      }
    };

    processScan();
  }, [result, firestore, toast, lastResult]);

  const getUserInitials = (name?: string) => name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

  return (
    <div className="w-full h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background decorative elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-500/10 blur-[120px] rounded-full pointer-events-none" />

      {!status && hasCamera && isClient && (
        <>
          {/* Check for MediaDevices support (Secure Context) */}
          {typeof navigator !== 'undefined' && !navigator.mediaDevices ? (
            <div className="text-center text-white max-w-lg mx-auto z-10">
              <CameraOff className="h-24 w-24 text-yellow-400 mx-auto" />
              <h2 className="text-3xl font-bold mt-4 text-yellow-500 font-headline">HTTPS Requerido</h2>
              <p className="text-lg text-gray-300 mt-2">
                El navegador bloqueó la cámara porque la conexión (HTTP) no es segura.
              </p>
              <div className="bg-gray-800/80 backdrop-blur-md p-6 rounded-2xl text-left text-sm mt-6 border border-gray-700 shadow-2xl">
                <p className="font-bold text-lg mb-2 text-white">Solución rápida en Android (Chrome):</p>
                <ol className="list-decimal pl-5 space-y-2 text-gray-300">
                  <li>Abre una nueva pestaña y ve a: <br /><code className="bg-black/50 px-1 text-green-400 select-all font-mono">chrome://flags</code></li>
                  <li>Busca: <span className="text-yellow-300 italic">unsafely-treat-insecure-origin-as-secure</span></li>
                  <li>Cambia a <span className="text-blue-400 font-bold">Enabled</span></li>
                  <li>Escribe la URL del sistema: (ej: <code className="text-green-400">http://192.168.1.10:3000</code>)</li>
                  <li>Toca <span className="text-blue-400 font-bold">Relaunch</span> y vuelve a esta página.</li>
                </ol>
              </div>
            </div>
          ) : (
            <>
              <div className="absolute top-8 left-8 text-white z-10">
                <h1 className="text-4xl font-bold font-headline tracking-tight">Kiosko de Asistencia</h1>
                <p className="text-blue-300/80 mt-1 font-medium">Escanea tu código QR para marcar entrada o salida</p>
              </div>

              <div className="absolute top-8 right-8 z-10">
                <div className="flex flex-col items-end gap-2">
                  <div className="text-white text-right mb-2">
                    <p className="text-2xl font-bold">{format(new Date(), 'HH:mm')}</p>
                    <p className="text-xs text-blue-300 uppercase tracking-widest">{format(new Date(), 'EEEE, d MMMM', { locale: es })}</p>
                  </div>
                  <ManualCheckIn />
                </div>
              </div>

              <div className="w-full max-w-md h-auto aspect-square overflow-hidden rounded-[2.5rem] border-8 border-white/5 bg-gray-800/50 relative shadow-[0_0_50px_rgba(0,0,0,0.5)] group">
                <div className="absolute inset-0 z-10 pointer-events-none border-2 border-white/10 rounded-[2rem] m-1" />
                <QrScanner
                  delay={300}
                  onError={handleError}
                  onScan={handleScan}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  constraints={{
                    video: {
                      facingMode: 'environment',
                      width: { min: 640, ideal: 1280, max: 1920 },
                      height: { min: 480, ideal: 720, max: 1080 },
                      aspectRatio: 1
                    }
                  }}
                />

                {/* Scanner Frame UI */}
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                  <div className="w-64 h-64 border-2 border-white/20 rounded-3xl relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-xl" />

                    {/* Scanning Line Animation */}
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.8)] animate-[scan_3s_ease-in-out_infinite]" />
                  </div>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-gray-900/40 pointer-events-none" />
              </div>

              <p className="text-white/40 mt-8 text-sm font-medium tracking-wide animate-pulse">ESPERANDO ESCANEO...</p>
            </>
          )}
        </>
      )}

      {status === 'success_in' && scannedUser && (
        <div className="text-center text-white z-20 animate-in zoom-in duration-300">
          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full scale-150" />
            <CheckCircle className="h-40 w-40 text-green-400 mx-auto relative drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]" />
          </div>
          <h2 className="text-5xl font-bold mt-4 font-headline tracking-tight">¡Bienvenido!</h2>
          <p className="text-3xl font-medium mt-2 text-green-100">{scannedUser.name}</p>
          <div className="mt-8 inline-block px-6 py-3 bg-green-500/10 border border-green-500/20 rounded-full">
            <p className="text-xl text-green-300 font-semibold">{message}</p>
          </div>
        </div>
      )}

      {status === 'success_out' && scannedUser && (
        <div className="text-center text-white z-20 animate-in zoom-in duration-300">
          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full scale-150" />
            <CheckCircle className="h-40 w-40 text-blue-400 mx-auto relative drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]" />
          </div>
          <h2 className="text-5xl font-bold mt-4 font-headline tracking-tight">¡Hasta luego!</h2>
          <p className="text-3xl font-medium mt-2 text-blue-100">{scannedUser.name}</p>
          <div className="mt-8 inline-block px-6 py-3 bg-blue-500/10 border border-blue-500/20 rounded-full">
            <p className="text-xl text-blue-300 font-semibold">{message}</p>
          </div>
          <p className="mt-4 text-blue-400/60 italic">Buen viaje de regreso a casa</p>
        </div>
      )}

      {status === 'error' && (
        <div className="text-center text-white z-20 animate-in zoom-in duration-300">
          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full scale-150" />
            <XCircle className="h-40 w-40 text-red-500 mx-auto relative drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
          </div>
          <h2 className="text-5xl font-bold mt-4 font-headline text-red-400 tracking-tight">Registro Fallido</h2>
          <p className="text-2xl mt-4 text-red-200/80 px-8 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl max-w-lg">
            {message}
          </p>
          <p className="mt-6 text-white/40">Por favor, intenta de nuevo o solicita ayuda al supervisor.</p>
        </div>
      )}

      {/* Style for scanning animation */}
      <style jsx global>{`
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
      `}</style>
    </div>
  );
}
