"use client";

import React from "react";
import Image from "next/image";

interface ProviderSelectorProps {
  selectedProvider: "stripe" | "datatrans" | null;
  onProviderSelect: (provider: "stripe" | "datatrans") => void;
  disabled?: boolean;
}

export default function ProviderSelector({
  selectedProvider,
  onProviderSelect,
  disabled = false,
}: ProviderSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stripe Option */}
        <button
          type="button"
          onClick={() => onProviderSelect("stripe")}
          disabled={disabled}
          className={`relative p-6 border-2 rounded-lg transition-all text-left ${
            selectedProvider === "stripe"
              ? "border-orange-500 bg-orange-50"
              : "border-gray-200 hover:border-gray-300"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          {selectedProvider === "stripe" && (
            <div className="absolute top-2 right-2">
              <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mb-3">
            <Image
              src="/images/providers/stripe.svg"
              alt="Stripe Logo"
              className="h-8 w-auto"
              width={32}
              height={32}
            />
            <h4 className="text-lg font-semibold text-gray-900">Stripe</h4>
          </div>

          <p className="text-sm text-gray-600 mb-3">
            Kredit-/Debitkarte, Apple Pay, Google Pay
          </p>

          <div className="flex items-center gap-2">
            {/* Card Logos */}
            <Image
              src="/images/providers/visa.svg"
              alt="Visa"
              className="h-6 w-auto"
              width={0}
              height={0}
            />
            <Image
              src="/images/providers/mastercard.svg"
              alt="Mastercard"
              className="h-6 w-auto"
              width={0}
              height={0}
            />
            <Image
              src="/images/providers/amex.svg"
              alt="American Express"
              className="h-6 w-auto"
              width={0}
              height={0}
            />
            <Image
              src="/images/providers/apple-pay.svg"
              alt="Apple Pay"
              className="h-6 w-auto"
              height={0}
              width={0}
            />
            <Image
              src="/images/providers/google-pay.svg"
              alt="Google Pay"
              className="h-6 w-auto"
              height={0}
              width={0}
            />
          </div>

          <div className="mt-3 flex items-center gap-2">
            <svg
              className="w-4 h-4 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span className="text-xs text-gray-500">Sichere Zahlung</span>
          </div>
        </button>

        {/* DataTrans Option */}
        <button
          type="button"
          onClick={() => onProviderSelect("datatrans")}
          disabled={disabled}
          className={`relative p-6 border-2 rounded-lg transition-all text-left ${
            selectedProvider === "datatrans"
              ? "border-orange-500 bg-orange-50"
              : "border-gray-200 hover:border-gray-300"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          {selectedProvider === "datatrans" && (
            <div className="absolute top-2 right-2">
              <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mb-3">
            <Image
              src="/images/providers/datatrans.svg"
              alt="DataTrans Logo"
              className="h-8 w-auto"
              width={32}
              height={32}
            />
            <h4 className="text-lg font-semibold text-gray-900">DataTrans</h4>
          </div>

          <p className="text-sm text-gray-600 mb-3">
            TWINT - Die Schweizer Zahlungs-App
          </p>

          <div className="flex items-center gap-2">
            {/* TWINT Logo */}
            <div className="bg-black text-white px-3 py-1 rounded font-bold text-sm">
              TWINT
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <svg
              className="w-4 h-4 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span className="text-xs text-gray-500">Sichere Zahlung</span>
          </div>
        </button>
      </div>

      {!selectedProvider && (
        <p className="text-sm text-red-600 mt-2">
          Bitte wählen Sie eine Zahlungsmethode aus
        </p>
      )}

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Sichere Weiterleitung</p>
            <p>
              Nach der Auswahl werden Sie sicher zur Zahlungsseite des Anbieters
              weitergeleitet. Ihre Zahlungsdaten werden nicht auf unseren
              Servern gespeichert.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
