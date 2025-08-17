"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, RefreshCw, XCircle } from "lucide-react";

export default function CheckoutFailurePage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const provider = searchParams.get("provider");
  const code = searchParams.get("code");

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      loadOrder();
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const loadOrder = async () => {
    if (!orderId) return;

    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (response.ok) {
        const orderData = await response.json();
        setOrder(orderData);
      }
    } catch (error) {
      console.error("Error loading order:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFailureMessage = () => {
    switch (code) {
      case "cancelled":
        return {
          title: "Zahlung abgebrochen",
          message:
            "Sie haben die Zahlung abgebrochen. Ihre Bestellung wurde nicht abgeschlossen.",
          icon: <XCircle className="h-8 w-8 text-yellow-600" />,
          bgColor: "bg-yellow-100",
        };
      case "failed":
        return {
          title: "Zahlung fehlgeschlagen",
          message:
            "Die Zahlung konnte nicht verarbeitet werden. Bitte überprüfen Sie Ihre Zahlungsdaten und versuchen Sie es erneut.",
          icon: <AlertCircle className="h-8 w-8 text-red-600" />,
          bgColor: "bg-red-100",
        };
      case "expired":
        return {
          title: "Zahlungssitzung abgelaufen",
          message:
            "Die Zahlungssitzung ist abgelaufen. Bitte starten Sie den Zahlungsvorgang erneut.",
          icon: <AlertCircle className="h-8 w-8 text-orange-600" />,
          bgColor: "bg-orange-100",
        };
      default:
        return {
          title: "Zahlung nicht erfolgreich",
          message:
            "Es gab ein Problem bei der Verarbeitung Ihrer Zahlung. Bitte versuchen Sie es erneut.",
          icon: <AlertCircle className="h-8 w-8 text-red-600" />,
          bgColor: "bg-red-100",
        };
    }
  };

  const failure = getFailureMessage();
  const providerName = provider === "stripe" ? "Stripe" : "DataTrans";

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="h-8 w-8 text-gray-600 animate-spin" />
            </div>
            <p className="text-gray-600">Wird geladen...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <div
            className={`w-16 h-16 ${failure.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}
          >
            {failure.icon}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {failure.title}
          </h1>
          <p className="text-gray-600 mb-6">{failure.message}</p>

          {order && (
            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <p className="text-lg font-bold" style={{ color: "#F39236" }}>
                Bestellnummer: {order.order_number}
              </p>
              <p className="text-gray-600 mt-1">
                Zahlungsanbieter: {providerName}
              </p>
            </div>
          )}

          {/* Troubleshooting Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-left">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Lösungsvorschläge
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              {code === "cancelled" ? (
                <>
                  <li>
                    • Stellen Sie sicher, dass Sie den Zahlungsvorgang
                    abschließen möchten
                  </li>
                  <li>• Überprüfen Sie Ihre Internetverbindung</li>
                  <li>• Versuchen Sie es mit einem anderen Browser</li>
                </>
              ) : (
                <>
                  <li>
                    • Überprüfen Sie Ihre Kartendaten (Nummer, Ablaufdatum, CVC)
                  </li>
                  <li>
                    • Stellen Sie sicher, dass genügend Guthaben verfügbar ist
                  </li>
                  <li>• Versuchen Sie es mit einer anderen Zahlungsmethode</li>
                  <li>
                    • Kontaktieren Sie Ihre Bank, falls das Problem weiterhin
                    besteht
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {orderId && (
                <Link
                  href={`/checkout/payment?orderId=${orderId}`}
                  className="inline-flex items-center px-6 py-3 text-white font-medium rounded-md transition-colors hover:opacity-90"
                  style={{ backgroundColor: "#F39236" }}
                >
                  Erneut versuchen
                </Link>
              )}
              <Link
                href={`/checkout/payment?orderId=${orderId}`}
                className="inline-flex items-center px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
              >
                Anderen Zahlungsanbieter wählen
              </Link>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <Link
                href="/cart"
                className="inline-flex items-center px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                Zurück zum Warenkorb
              </Link>
            </div>
          </div>

          {/* Need Help Section */}
          <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">
              Benötigen Sie Hilfe?
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              Falls Sie weiterhin Probleme haben, kontaktieren Sie uns gerne.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center text-sm">
              <span className="text-gray-600">
                E-Mail: support@bauprodukt.ch
              </span>
              <span className="hidden sm:inline text-gray-400">|</span>
              <span className="text-gray-600">Telefon: +41 44 123 45 67</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
