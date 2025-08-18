import { useState } from "react";
import { motion } from "framer-motion";
import { pageTransition, cardHover, listItem } from "@/lib/motion-variants";
import { HelpCircle, Mail, BarChart, CheckCircle } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import ParticleBackground from "@/components/ParticleBackground";

const Support = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Vaša poruka je uspješno poslata! Naš tim će vam se javiti uskoro.");
  };

  const faqItems = [
    {
      question: "Kako da pratim svoju pošiljku?",
      answer: "Možete pratiti svoju pošiljku u realnom vremenu koristeći stranicu 'Praćenje'. Unesite broj za praćenje i vidjet ćete trenutnu lokaciju i status vaše pošiljke."
    },
    {
      question: "Kako da promijenim jezik aplikacije?",
      answer: "Jezik aplikacije možete promijeniti na stranici 'Postavke' pod sekcijom 'Izgled'."
    },
    {
      question: "Šta da radim ako mi je ruta blokirana?",
      answer: "Ako je vaša ruta blokirana, naš AI sistem će automatski predložiti alternativnu rutu. Također ćete dobiti obavještenje sa detaljima. Za hitne slučajeve, kontaktirajte našu 24/7 podršku."
    },
    {
        question: "Kako mogu da dodam novog vozača u sistem?",
        answer: "Nove vozače možete dodati u odjeljku 'Tim' koji se nalazi u donjem dijelu bočne navigacije. Potrebno je da imate administratorske privilegije."
    }
  ];

  return (
        <motion.div
            className="min-h-screen w-full bg-black/90 relative overflow-hidden"
            variants={pageTransition}
            initial="initial"
            animate="animate"
            exit="exit"
        >
            {/* Hero image as background, zoomed out and darkened */}
            <img
                src="/src/assets/hero-logistics.jpg"
                alt="Logistics hero background"
                className="fixed inset-0 w-full h-full object-cover object-center scale-110 md:scale-125 z-0"
                style={{ filter: 'brightness(0.45) blur(2px)' }}
            />
            {/* Glassy dark overlay for extra porosity */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-zinc-900/80 to-black/90 backdrop-blur-xl z-10" />
            <div className="relative z-20">
                <Sidebar isOpen={sidebarOpen} onAlertsClick={() => {}} />
                <main className={cn("transition-all duration-300 pt-header", sidebarOpen ? "ml-64" : "ml-16")}> 
                    <div className="p-6 space-y-8">
                        <header className="space-y-2 animate-slide-up-fade">
                            <h1 className="text-3xl font-bold text-white drop-shadow-lg">Centar za podršku</h1>
                            <p className="text-zinc-300">Pronađite odgovore na vaša pitanja i kontaktirajte naš tim.</p>
                        </header>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-8">
                                {/* FAQ Section */}
                                <Card className="bg-black/60 backdrop-blur-xl border border-white/10 text-white shadow-xl rounded-2xl">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-white"><HelpCircle /> Često postavljana pitanja (FAQ)</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Accordion type="single" collapsible className="w-full">
                                            {faqItems.map((item, index) => (
                                                <AccordionItem value={`item-${index}`} key={index}>
                                                    <AccordionTrigger className="text-zinc-200">{item.question}</AccordionTrigger>
                                                    <AccordionContent className="text-zinc-300">{item.answer}</AccordionContent>
                                                </AccordionItem>
                                            ))}
                                        </Accordion>
                                    </CardContent>
                                </Card>
                                {/* Contact Form */}
                                <Card className="bg-black/60 backdrop-blur-xl border border-white/10 text-white shadow-xl rounded-2xl">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-white"><Mail /> Kontaktirajte podršku</CardTitle>
                                        <CardDescription className="text-zinc-300">Imate pitanje koje nije u FAQ? Pišite nam.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <form className="space-y-4" onSubmit={handleSubmit}>
                                            <div className="space-y-2">
                                                <Label htmlFor="subject" className="text-zinc-200">Naslov</Label>
                                                <Input id="subject" placeholder="Unesite naslov poruke" className="bg-black/40 border-white/10 text-white placeholder-zinc-400 focus:ring-2 focus:ring-blue-400" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="message" className="text-zinc-200">Poruka</Label>
                                                <Textarea id="message" placeholder="Unesite vašu poruku" rows={6} className="bg-black/40 border-white/10 text-white placeholder-zinc-400 focus:ring-2 focus:ring-blue-400" />
                                            </div>
                                            <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold shadow-lg hover:brightness-110">Pošalji poruku</Button>
                                        </form>
                                    </CardContent>
                                </Card>
                            </div>
                            {/* System Status Section */}
                            <div className="lg:col-span-1 space-y-8">
                                <Card className="bg-black/60 backdrop-blur-xl border border-white/10 text-white shadow-xl rounded-2xl">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-white"><BarChart /> Status sistema</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-zinc-300">Glavni API</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse-glow" />
                                                <span className="text-green-400">Operativan</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-zinc-300">AI Modul</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse-glow" />
                                                <span className="text-green-400">Operativan</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-zinc-300">Baza podataka</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse-glow" />
                                                <span className="text-green-400">Operativan</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-zinc-300">Web Aplikacija</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse-glow" />
                                                <span className="text-green-400">Operativan</span>
                                            </div>
                                        </div>
                                        <div className="pt-2 text-center">
                                            <p className="text-xs text-zinc-400">Svi sistemi su operativni.</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </motion.div>
  );
};

export default Support;
