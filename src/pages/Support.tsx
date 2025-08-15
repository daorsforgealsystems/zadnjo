import { useState } from "react";
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
    <div className="min-h-screen bg-background relative overflow-hidden">
        <ParticleBackground />
        <div className="relative z-20">
            <Sidebar isOpen={sidebarOpen} onAlertsClick={() => {}} />

            <main className={cn("transition-all duration-300 pt-header", sidebarOpen ? "ml-64" : "ml-16")}>
                <div className="p-6 space-y-6">
                    <header className="space-y-2 animate-slide-up-fade">
                        <h1 className="text-3xl font-bold gradient-text">Centar za podršku</h1>
                        <p className="text-muted-foreground">Pronađite odgovore na vaša pitanja i kontaktirajte naš tim.</p>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            {/* FAQ Section */}
                            <Card className="glass">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><HelpCircle /> Često postavljana pitanja (FAQ)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Accordion type="single" collapsible className="w-full">
                                        {faqItems.map((item, index) => (
                                            <AccordionItem value={`item-${index}`} key={index}>
                                                <AccordionTrigger>{item.question}</AccordionTrigger>
                                                <AccordionContent>{item.answer}</AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </CardContent>
                            </Card>

                            {/* Contact Form */}
                            <Card className="glass">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Mail /> Kontaktirajte podršku</CardTitle>
                                    <CardDescription>Imate pitanje koje nije u FAQ? Pišite nam.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form className="space-y-4" onSubmit={handleSubmit}>
                                        <div className="space-y-2">
                                            <Label htmlFor="subject">Naslov</Label>
                                            <Input id="subject" placeholder="Unesite naslov poruke" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="message">Poruka</Label>
                                            <Textarea id="message" placeholder="Unesite vašu poruku" rows={6} />
                                        </div>
                                        <Button type="submit" className="w-full bg-gradient-primary hover:scale-105 transition-transform">Pošalji poruku</Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>

                        {/* System Status Section */}
                        <div className="lg:col-span-1 space-y-6">
                            <Card className="glass">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><BarChart /> Status sistema</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Glavni API</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-success animate-pulse-glow" />
                                            <span className="text-success">Operativan</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">AI Modul</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-success animate-pulse-glow" />
                                            <span className="text-success">Operativan</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Baza podataka</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-success animate-pulse-glow" />
                                            <span className="text-success">Operativan</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Web Aplikacija</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-success animate-pulse-glow" />
                                            <span className="text-success">Operativan</span>
                                        </div>
                                    </div>
                                    <div className="pt-2 text-center">
                                         <p className="text-xs text-muted-foreground">Svi sistemi su operativni.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>
  );
};

export default Support;
