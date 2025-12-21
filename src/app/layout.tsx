import { AppSidebar } from "@/components/app-sidebar";
import { Providers } from "@/components/providers";
import { SearchHeader } from "@/components/search-header";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WeatherWise Nearby",
  description: "Discover the best places near you based on current weather",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <div className="flex min-h-screen w-full">
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset className="flex flex-col flex-1">
                <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 lg:h-[60px]">
                  <SidebarTrigger className="-ml-1" />
                  <Separator orientation="vertical" className="mr-2 h-4" />
                  <div className="flex-1 flex items-center justify-between gap-4">
                    <h1 className="text-lg font-semibold lg:text-xl hidden md:block">WeatherWise</h1>
                    <SearchHeader />
                  </div>
                </header>
                <div className="flex-1 overflow-auto">
                  {children}
                </div>
              </SidebarInset>
            </SidebarProvider>
          </div>
        </Providers>
        <script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_PLACES_API_KEY || process.env.PLACES_API_KEY}&libraries=places`}
          async
          defer
        ></script>
      </body>
    </html>
  );
}
