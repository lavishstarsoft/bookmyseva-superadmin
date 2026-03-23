"use client";

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { toPng } from 'html-to-image';

interface ShippingLabelProps {
    order: any;
    onClose: () => void;
}

export default function ShippingLabel({ order, onClose }: ShippingLabelProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Derive vendor details from the order object to match the structure used in Vendor App
    // Fallback values provided for robustness
    const vendor = {
        name: order.vendor?.vendorName || "BookMySeva Vendor",
        address: order.vendorDetails?.address || "Address Unavailable",
        phone: order.vendorDetails?.phone || "Phone Unavailable"
    };

    useEffect(() => {
        if (canvasRef.current && order) {
            // Generate verification URL or encrypted data string
            // For now, let's use a simple structured string that could be verified
            // In a real app, this would be a signed JWT or a URL pointing to a verification page
            const verificationData = `VERIFIED_PACKAGE|${order.orderId}|${new Date(order.createdAt).toISOString()}|${vendor.name}`;
            const verificationUrl = `https://bookmyseva.com/verify-package?data=${encodeURIComponent(btoa(verificationData))}`;
            
            QRCode.toCanvas(canvasRef.current, verificationUrl, {
                width: 120,
                margin: 0,
                color: {
                    dark: '#000000',
                    light: '#FFFFFFFF'
                },
                errorCorrectionLevel: 'M'
            }, (error) => {
                if (error) console.error(error);
            });
        }
    }, [order, vendor]);

    const handlePrint = async () => {
        const labelElement = document.querySelector('.shipping-label-preview') as HTMLElement | null;
        if (!labelElement) {
            console.error('Shipping label element not found');
            return;
        }

        try {
            const dataUrl = await toPng(labelElement, {
                cacheBust: true,
                pixelRatio: 3,
                backgroundColor: '#ffffff'
            });

            const printWindow = window.open('', '_blank', 'width=1000,height=800');
            if (!printWindow) {
                console.error('Unable to open print window');
                return;
            }

            printWindow.document.open();
            printWindow.document.write(`
                <!doctype html>
                <html>
                    <head>
                        <meta charset="utf-8" />
                        <title>Shipping Label</title>
                        <style>
                            html, body {
                                margin: 0;
                                padding: 0;
                                background: #ffffff;
                            }
                            body {
                                display: flex;
                                justify-content: center;
                                align-items: flex-start;
                                padding: 4mm;
                            }
                            img {
                                display: block;
                                width: 130mm;
                                height: auto;
                            }
                            @page {
                                size: auto;
                                margin: 4mm;
                            }
                        </style>
                    </head>
                    <body>
                        <img src="${dataUrl}" alt="Shipping Label" />
                    </body>
                </html>
            `);
            printWindow.document.close();

            printWindow.onload = () => {
                setTimeout(() => {
                    printWindow.focus();
                    printWindow.print();
                    printWindow.close();
                }, 300);
            };
        } catch (error) {
            console.error('Failed to render label for print', error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 print:p-0 print:bg-white print:static print:block backdrop-blur-sm overflow-hidden">
            <div className="bg-white max-w-lg w-full max-h-[90vh] flex flex-col rounded-xl shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none print:rounded-none print:max-h-none border border-gray-200">
                
                {/* Header (Hidden in Print) */}
                <div className="p-4 border-b flex items-center justify-between bg-gray-50 print:hidden shrink-0">
                    <h2 className="font-bold text-lg text-gray-800">Print Shipping Label</h2>
                    <div className="flex gap-2">
                        <button 
                            onClick={handlePrint}
                            className="bg-[#8D0303] text-white px-4 py-2 rounded-md hover:bg-[#6d0202] text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                            Print Label
                        </button>
                        <button 
                            onClick={onClose}
                            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-medium transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* The Label Area - Designed for standard 4x6 or A6 label, but adaptable */}
                <div className="bg-white text-black font-sans print:p-0 print:m-0 print:w-full print:h-full overflow-y-auto p-4 sm:p-8 flex-1 flex flex-col items-center bg-gray-100 min-h-0">
                    {/* Outer Border for Label */}
                    <div className="shipping-label-preview bg-white shadow-sm border-[6px] border-black p-6 w-[100mm] min-h-[145mm] shrink-0 print:max-w-none print:mx-0 print:border-[6px] print:h-[145mm] print:w-[100mm] print:shadow-none relative box-border transform scale-[0.65] sm:scale-[0.75] md:scale-[0.85] lg:scale-100 origin-top flex flex-col justify-between mb-8 transition-transform duration-200">
                        
                        {/* Header with Logo */}
                        <div className="flex justify-between items-end border-b-[3px] border-black pb-4 mb-4">
                            <div className="flex flex-col justify-center h-12">
                                {/* Logo replaces the text header */}
                                <img src="/superadmin/logo.png" alt="BookMySeva" className="h-14 w-auto object-contain -ml-1" />
                            </div>
                            <div className="text-right">
                                <h2 className="text-xl font-black uppercase tracking-tight leading-none">{order.deliverySlot || "Standard"}</h2>
                                <p className="text-sm font-bold font-mono mt-1">{new Date().toLocaleDateString()}</p>
                            </div>
                        </div>

                        {/* Order ID Section */}
                        <div className="text-center mb-2 relative">
                            <p className="font-mono text-sm tracking-[0.2em] mb-1 uppercase font-bold text-gray-700">Order ID</p>
                            <h3 className="text-3xl font-black tracking-tighter mb-2 break-words">{order.orderId}</h3>
                            
                            {/* Triangle Divider Pattern */}
                            <div className="flex justify-center overflow-hidden w-full h-6 border-b-[3px] border-black">
                                {Array.from({ length: 9 }).map((_, i) => (
                                    <div key={i} className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[20px] border-b-black mx-0.5" />
                                ))}
                            </div>
                        </div>

                        {/* Shipping Details */}
                        <div className="mb-4 relative px-2">
                            <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">SHIP TO:</p>
                            <div className="pl-3 border-l-[6px] border-black py-1">
                                <p className="font-black text-lg leading-tight mb-1">{order.user?.name || "Valued Customer"}</p>
                                <p className="text-sm font-semibold leading-snug mb-1">
                                    {order.deliveryAddress?.line1}<br />
                                    {order.deliveryAddress?.city}, {order.deliveryAddress?.state} - {order.deliveryAddress?.pincode}
                                </p>
                                <p className="text-base font-black">Ph: {order.user?.phone}</p>
                            </div>
                        </div>
                        
                        {/* Footer Grid */}
                        <div className="grid grid-cols-2 gap-4 border-t-[3px] border-black pt-3 flex-1 mb-2">
                            {/* Return Address */}
                            <div>
                                <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">RETURN ADDRESS:</p>
                                <p className="text-xs font-bold leading-tight">
                                    {vendor.name}<br />
                                    <span className="font-normal">{vendor.address}</span><br />
                                    Phone: {vendor.phone}
                                </p>
                            </div>

                            {/* Contents */}
                            <div>
                                <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">CONTENTS:</p>
                                <p className="text-xs font-medium leading-tight">
                                    {order.kit?.title}<br />
                                    Qty: {order.quantity}<br />
                                    <span className="text-[10px] text-gray-500 italic block mt-1">Handle with care</span>
                                </p>
                            </div>
                        </div>

                            {/* Security Footer */}
                            <div className="border-t-[3px] border-black mt-auto mb-2"></div>
                            <div className="flex pt-1 relative items-center">
                           {/* QR on Left */}
                           <div className="shrink-0 bg-white p-0 mr-3">
                                <canvas ref={canvasRef} className="w-20 h-20 block !m-0 !p-0"></canvas>
                           </div>

                           <div className="flex-1 flex flex-col justify-between min-h-[80px]">
                                <div>
                                    <p className="text-xs font-black uppercase text-gray-700 mb-0.5">SECURE PACKAGE</p>
                                    <p className="text-[9px] leading-tight text-gray-500">
                                        Scan to verify package authenticity. Do not accept if seal is broken.
                                    </p>
                                </div>
                                
                                <div className="mt-2 self-end border border-dotted border-gray-400 px-2 py-0.5 mr-1">
                                    <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-gray-600">VERIFIED VENDOR</p>
                                </div>
                           </div>
                        </div>

                        {/* Cut Line */}
                        <div className="absolute left-0 right-0 -bottom-8 text-center text-gray-500 text-xs print:hidden mb-4">
                            --- Preview (A6 / 4x6 Label) ---
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}