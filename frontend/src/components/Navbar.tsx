import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Globe, Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import HeaderAdCarousel from "./HeaderAdCarousel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import englandFlag from "@/assets/england.jpg";
import rwandaFlag from "@/assets/rwanda.png";
import franceFlag from "@/assets/france.jpg";
import logo from "@/assets/Logo.jpg";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();

  // Live clock — updates every second
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Kinyarwanda month/day names (browser has no rw-RW locale support)
  const RW_WEEKDAYS = ['Ku cyumweru', 'Kuwa mbere', 'Kuwa kabiri', 'Kuwa gatatu', 'Kuwa kane', 'Kuwa gatanu', 'Kuwa gatandatu'];
  const RW_MONTHS  = ['Mutarama', 'Gashyantare', 'Werurwe', 'Mata', 'Gicurasi', 'Kamena', 'Nyakanga', 'Kanama', 'Nzeli', 'Ukwakira', 'Ugushyingo', 'Ukuboza'];

  const formattedDate = (() => {
    if (language === 'RW') {
      return `${RW_WEEKDAYS[now.getDay()]}, ${now.getDate()} ${RW_MONTHS[now.getMonth()]} ${now.getFullYear()}`;
    }
    const locale = language === 'FR' ? 'fr-FR' : 'en-US';
    return now.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  })();

  const formattedTime = now.toLocaleTimeString(language === 'FR' ? 'fr-FR' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: language !== 'FR',
  });

  const categories = [
    { name: t("nav.home"), path: "/" },
    { name: t("nav.politics"), path: "/politics" },
    { name: t("nav.business"), path: "/youth" },
    { name: t("nav.technology"), path: "/technology" },
    { name: t("nav.sports"), path: "/sports" },
    { name: t("nav.entertainment"), path: "/entertainment" },
    { name: t("nav.economics"), path: "/economics" },
    { name: t("nav.education"), path: "/education" },
    { name: t("nav.myStory"), path: "/my-story" },
    { name: t("nav.others"), path: "/my-district" },
    { name: "Videos", path: "https://www.youtube.com/@RobertBashimiki250", external: true },
    { name: t("nav.contact"), path: "/contact" },
  ];

  const languageOptions: Array<{
    code: "EN" | "RW" | "FR";
    label: string;
    flag: string;
  }> = [
    { code: "EN", label: "English", flag: englandFlag },
    { code: "RW", label: "Kinyarwanda", flag: rwandaFlag },
    { code: "FR", label: "Français", flag: franceFlag },
  ];

  const activeLanguage = languageOptions.find((option) => option.code === language) ?? languageOptions[0];

  const isActivePath = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    // Handle renamed routes — both old and new paths highlight the same nav item
    if (path === "/youth") return location.pathname === "/youth" || location.pathname === "/business";
    if (path === "/my-district") return location.pathname === "/my-district" || location.pathname === "/others";
    return location.pathname.startsWith(path);
  };

  // Only show header ad on homepage
  const isHomePage = location.pathname === "/";

  return (
    <>
      {/* Top Advertisement Banner - Full width at very top - Only on homepage */}
      {isHomePage && (
        <div className="w-full bg-navy relative overflow-hidden">
          <div className="relative w-full">
            <HeaderAdCarousel position="header" />
          </div>
        </div>
      )}

    <header className="sticky top-0 z-50 bg-background shadow-md">
      {/* Top Bar */}
        <div className="bg-navy">
        <div className="container mx-auto px-4">
            <div className="flex items-center justify-between gap-4 py-3">
              {/* Logo and Site Name */}
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <Link to="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-90 transition-opacity">
                  <img
                    src={logo}
                    alt="Global Times Rwanda Logo"
                    className="h-8 sm:h-10 md:h-12 w-auto object-contain"
                  />
                  <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white whitespace-nowrap">
                Global Times <span className="text-gold">Rwanda</span>
                  </span>
              </Link>
            </div>
            
              {/* Language Switcher and Search */}
              <div className="flex items-center gap-3 flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-gold hover:bg-navy/50 gap-2"
                >
                  <Globe className="h-4 w-4" />
                    <img
                      src={activeLanguage.flag}
                      alt={`${activeLanguage.label} flag`}
                      className="h-4 w-6 object-cover rounded-sm"
                    />
                    <span className="font-semibold">{activeLanguage.code}</span>
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {languageOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.code}
                      onClick={() => setLanguage(option.code)}
                      className="flex items-center gap-2"
                    >
                      <img
                        src={option.flag}
                        alt={`${option.label} flag`}
                        className="h-4 w-6 object-cover rounded-sm"
                      />
                      <span className="font-medium">{option.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <a
                href="https://wa.me/250784625552"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat on WhatsApp"
                title="Chat on WhatsApp"
                className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-[#25D366] hover:bg-[#20ba5a] active:scale-95 transition-all shadow-md"
              >
                {/* Official WhatsApp SVG icon */}
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 fill-white"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Date / Time bar */}
      <div className="bg-navy/95 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-1.5 text-xs text-white/70">
            <span className="tracking-wide">{formattedDate}</span>
            <span className="font-mono tabular-nums tracking-widest text-gold/90">{formattedTime}</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-news-red">
        <div className="container mx-auto px-2">
          <div className="flex items-center justify-between">
            {/* Desktop Menu — distribute all items evenly across the full bar */}
            <ul className="hidden md:flex items-center w-full justify-between">
              {categories.map((category) => {
                const active = isActivePath(category.path);
                if (category.external) {
                  return (
                    <li key={category.name} className="flex-1 text-center">
                      <a
                        href={category.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative block px-1 py-3 text-xs lg:text-sm font-semibold text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                      >
                        {category.name}
                      </a>
                    </li>
                  );
                }
                return (
                  <li key={category.path} className="flex-1 text-center">
                    <Link
                      to={category.path}
                      className={`relative block px-1 py-3 text-xs lg:text-sm font-semibold transition-colors whitespace-nowrap ${
                        active ? "bg-white/15 text-white" : "text-white hover:bg-white/10"
                      }`}
                    >
                      {category.name}
                      {active && (
                        <span className="absolute inset-x-1 bottom-1 h-0.5 bg-gold rounded-full" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden pb-4 animate-slide-up">
              <ul className="space-y-1">
                {categories.map((category) => {
                  const active = isActivePath(category.path);
                  if (category.external) {
                    return (
                      <li key={category.name}>
                        <a
                          href={category.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative block px-4 py-2.5 text-sm text-white hover:bg-white/10 transition-colors font-medium"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {category.name}
                        </a>
                      </li>
                    );
                  }
                  return (
                    <li key={category.path}>
                      <Link
                        to={category.path}
                        className={`relative block px-4 py-2.5 text-sm font-medium transition-colors ${
                          active ? "bg-white/15 text-white" : "text-white hover:bg-white/10"
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {category.name}
                        {active && (
                          <span className="absolute inset-x-2 bottom-1 h-0.5 bg-gold rounded-full" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </nav>
    </header>
    </>
  );
};

export default Navbar;
