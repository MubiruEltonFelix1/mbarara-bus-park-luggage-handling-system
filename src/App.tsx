import { Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider } from './store/AppStore'
import { ToastProvider } from './components/ui/Toast'
import { PrintProvider } from './store/PrintProvider'
import { AppLayout } from './components/layout/AppLayout'
import { Dashboard } from './pages/Dashboard'
import { NewTicket } from './pages/NewTicket'
import { AllTickets } from './pages/AllTickets'
import { TicketDetail } from './pages/TicketDetail'
import { Track } from './pages/Track'
import { PublicTrack } from './pages/PublicTrack'
import { Dispatch } from './pages/Dispatch'
import { Reports } from './pages/Reports'
import { Settings } from './pages/Settings'
import { Conductor } from './pages/Conductor'

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <PrintProvider>
          <Routes>
          {/* Public tracking — no app shell, no login */}
          <Route path="/track/:ticketId" element={<PublicTrack />} />

          {/* Conductor interface — no app shell, mobile-first */}
          <Route path="/conductor" element={<Conductor />} />

          {/* App shell routes */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tickets" element={<AllTickets />} />
            <Route path="/tickets/new" element={<NewTicket />} />
            <Route path="/tickets/:id" element={<TicketDetail />} />
            <Route path="/track" element={<Track />} />
            <Route path="/dispatch" element={<Dispatch />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </PrintProvider>
      </ToastProvider>
    </AppProvider>
  )
}
