import { Routes, Route } from 'react-router-dom'
import WebShootTransition from './components/WebShootTransition'
import CinematicIntro from './components/CinematicIntro'
import Dashboard from './pages/Dashboard'
import SearchBeforePost from './pages/SearchBeforePost'
import AIAssistant from './pages/AIAssistant'
import Discussions from './pages/Discussions'
import DoubtDetail from './pages/DoubtDetail'
import FAQ from './pages/FAQ'
import NewDoubt from './pages/NewDoubt'
import Subjects from './pages/Subjects'
import SubjectBoard from './pages/SubjectBoard'
import JoinSubject from './pages/JoinSubject'
import Resources from './pages/Resources'
import Community from './pages/Community'
import MyCommunity from './pages/MyCommunity'
import ExploreCommunities from './pages/ExploreCommunities'
import CommunityDetail from './pages/CommunityDetail'
import CommunityManage from './pages/CommunityManage'
import WiderNetwork from './pages/WiderNetwork'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import Policy from './pages/Policy'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'
import DoubtAnalytics from './pages/DoubtAnalytics'

function App() {
  return (
    <>
      <CinematicIntro />
      <WebShootTransition />
      <Routes>
      {/* Workspace & Dashboard */}
      <Route path="/" element={<Dashboard />} />
      <Route path="/feed" element={<Dashboard />} />
      <Route path="/analytics" element={<DoubtAnalytics />} />
      <Route path="/faculty/analytics" element={<DoubtAnalytics />} />

      {/* Curriculum & Subjects */}
      <Route path="/subjects" element={<Subjects />} />
      <Route path="/subjects/:id" element={<SubjectBoard />} />
      <Route path="/join" element={<JoinSubject />} />

      {/* Search & AI Assistant 2.0 */}
      <Route path="/search" element={<SearchBeforePost />} />
      <Route path="/ai-assistant" element={<AIAssistant />} />
      <Route path="/assistant" element={<AIAssistant />} />
      <Route path="/ai" element={<AIAssistant />} />

      {/* Discussions & Doubts */}
      <Route path="/explore" element={<Discussions mode="explore" />} />
      <Route path="/doubts" element={<Discussions mode="explore" />} />
      <Route path="/my-doubts" element={<Discussions mode="mine" />} />
      <Route path="/saved" element={<Discussions mode="saved" />} />
      <Route path="/requests" element={<Discussions mode="requests" />} />
      <Route path="/doubts/new" element={<NewDoubt />} />
      <Route path="/ask" element={<NewDoubt />} />
      <Route path="/doubts/:id" element={<DoubtDetail />} />

      {/* FAQ & Knowledge Base */}
      <Route path="/faq" element={<FAQ />} />

      {/* Resources & Community of Communities */}
      <Route path="/resources" element={<Resources />} />
      <Route path="/resources/:slug" element={<Resources />} />
      <Route path="/mentors" element={<Community />} />
      <Route path="/community" element={<MyCommunity />} />
      <Route path="/community/my" element={<MyCommunity />} />
      <Route path="/community/explore" element={<ExploreCommunities />} />
      <Route path="/communities" element={<ExploreCommunities />} />
      <Route path="/community/:idOrSlug" element={<CommunityDetail />} />
      <Route path="/community/:idOrSlug/manage" element={<CommunityManage />} />
      <Route path="/wider-network" element={<WiderNetwork />} />
      <Route path="/network" element={<WiderNetwork />} />

      {/* Account & Policies */}
      <Route path="/settings" element={<Settings />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/policy/:slug" element={<Policy />} />
      <Route path="/welcome" element={<LandingPage />} />

      {/* Authentication */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* 404 Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    </>
  )
}

export default App