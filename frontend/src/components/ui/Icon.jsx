import {
  BatteryCharging, Camera, ClipboardList, Cpu, Droplets, HardDrive, Headphones, Layers, Mic, PlugZap,
  ShieldCheck, Smartphone, Sparkles, Tablet, Truck, Unlock, Wallet, Wrench, Zap,
} from 'lucide-react'

// Maps the icon names stored in data files (services.js, accessories.js, content.js) to lucide components.
const ICONS = {
  BatteryCharging, Camera, ClipboardList, Cpu, Droplets, HardDrive, Headphones, Layers, Mic, PlugZap,
  ShieldCheck, Smartphone, Sparkles, Tablet, Truck, Unlock, Wallet, Wrench, Zap,
}

export default function Icon({ name, size = 22, className = '' }) {
  const C = ICONS[name] || Smartphone
  return <C size={size} strokeWidth={2} className={className} aria-hidden="true" />
}
