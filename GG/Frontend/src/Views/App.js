import logo from './logo.svg';
//import React from "react";
import './App.scss';
import {BrowserRouter as Router, Route, Routes, Navigate, useSearchParams} from "react-router-dom";
import Home from "../Components/Home";
import Registration from "../Components/Registration";
import Login from '../Components/Login';
import React, { useEffect } from 'react';
import CreateProfile from '../Components/CreateProfile';
import UpdateProfile from '../Components/UpdateProfile';
import Dashboard from '../Components/Dashboard';
import LogoutConfirmationPage from '../Components/LogoutConfirmationPage';
import Chat from '../Components/Chat';
import { Provider } from "react-redux";
import store from "../store/ReduxStore";
import { useDispatch } from "react-redux";
import HelpPage from '../Components/HelpPage';
import Translator from "../Components/Translator";
import TranslatorPanel from "../Components/TranslatorPanel";
import { TranslatorProvider } from "../context/TranslatorContext";
import AssistantPanel from "../Components/AssistantPanel";
import { AssistantProvider } from "../context/AssistantContext";
import Videocall from "../Components/Videocall";
import PostVideocall from '../Components/PostVideocall';
import FriendsPage from '../Components/FriendsPage';
import AvailabilityPicker from '../Components/AvailabilityPicker';
import Assistant from "../Components/Assistant";
import Scheduler from "../Components/Scheduler";
import TranscriptView from "../Components/TranscriptView";
import GameSelection from '../Components/GameSelect';
import TermMatching from '../Components/TermMatching';
import GrammarQuiz from '../Components/GrammarQuiz';
import PronunciationDrill from '../Components/PronunciationDrill';
import ChallengeHub from '../Components/ChallengeHub';
import TeamLobby  from '../Components/TeamLobby';
import TeamCreate from '../Components/TeamCreate';
import TeamPage   from '../Components/TeamPage';
import ViewProfile from '../Components/ViewProfile';
import SiteChrome from '../Components/SiteChrome';

function RedirectToFriends({ discover }) {
  const [sp] = useSearchParams();
  const p = new URLSearchParams(sp);
  if (discover) p.set('friendsSub', 'discover');
  else p.delete('friendsSub');
  return <Navigate to={{ pathname: '/Friends', search: p.toString() }} replace />;
}

const App = () => {
  useEffect(() => {
    document.body.classList.add('lm-mockup-ui');
    return () => document.body.classList.remove('lm-mockup-ui');
  }, []);

  return (
    <div className="App">
      <TranslatorProvider>
      <AssistantProvider>
      <Router>
       <Routes>
          <Route path ="/" element ={<Home />}/>
          <Route path ="/Login" element ={<Login/>}/>
          <Route path ="/Register" element ={<Registration />}/>
          <Route path ="/CreateProfile" element ={<CreateProfile />}/>
          <Route path ="/UpdateProfile" element ={<UpdateProfile />}/>
          <Route path ="/Dashboard" element ={<Dashboard />}/>
          <Route path="/Friends" element={<FriendsPage />} />
          <Route path="/FriendSearch" element={<RedirectToFriends discover />} />
          <Route path="/FriendsList" element={<RedirectToFriends discover={false} />} />
          <Route path ="/Translator" element = {<Translator />}/>
          <Route path ="/Videocall" element = {<Videocall />}/>
          <Route path ="/PostVideocall" element = {<PostVideocall />}/>
          <Route path ="/LogoutConfirmation" element ={<LogoutConfirmationPage />}/>
          <Route path ="/Chat" element ={<Chat/>}/>
          <Route path ="/HelpPage" element ={<HelpPage/>}/>
          <Route path="/AvailabilityPicker" element={<AvailabilityPicker/>}/>
          <Route path="/Assistant" element={<Assistant />} />
          <Route path="/Scheduler" element={<Scheduler />} />
          <Route path="/TranscriptView" element={<TranscriptView />} />
          <Route path="/GameSelection" element={<GameSelection />} />
          <Route path="/TermMatching" element={<TermMatching />} />
          <Route path="/GrammarQuiz" element={<GrammarQuiz />} />
          <Route path="/PronunciationDrill" element={<PronunciationDrill />} />
          <Route path="/Challenges" element={<ChallengeHub />} />
          <Route path="/TeamLobby"  element={<TeamLobby />} />
          <Route path="/TeamCreate" element={<TeamCreate />} />
          <Route path="/TeamPage"   element={<TeamPage />} />
          <Route path="/ViewProfile" element={<ViewProfile />} />
       </Routes>
       <TranslatorPanel />
       <AssistantPanel />
      </Router>
      <SiteChrome />
      </AssistantProvider>
      </TranslatorProvider>
    </div>
  );
}

export default App;
