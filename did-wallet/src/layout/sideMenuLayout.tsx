import { createContext, useContext, useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { styled, useTheme } from '@mui/material/styles'
import {
  Box,
  Drawer,
  CssBaseline,
  Toolbar,
  Typography,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Backdrop,
  CircularProgress,
} from '@mui/material'
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar'
import {
  Menu as IconMenu,
  ChevronLeft as IconChevronLeft,
  ChevronRight as IconChevronRight,
  Home as IconHome,
  QrCode as IconQrCode,
  Key as IconKey,
  CardMembership as IconCardMembership,
  Settings as IconSettings,
} from '@mui/icons-material'
import pkg from '../../package.json'

import { Settings } from '../helpers/settings'
import { DidModel } from '../helpers/didTools'

const drawerWidth = 200

// ロード中表示のコンテキスト
export type NowLoadingContextType = {
  isNowLoading: boolean
  setNowLoading: (isNowLoading: boolean) => void
}
const NowLoadingContext = createContext<NowLoadingContextType>(
  {} as NowLoadingContextType
)
export const useNowLoadingContext = () => {
  return useContext<NowLoadingContextType>(NowLoadingContext)
}

// 設定のコンテキスト
export type SettingsContextType = {
  settings: Settings | null
  setSettings: (settings: Settings) => void
}
const SettingsContext = createContext<SettingsContextType>(
  {} as SettingsContextType
)
export const useSettingsContext = () => {
  return useContext<SettingsContextType>(SettingsContext)
}

// DID情報のコンテキスト
export type DidContextType = {
  didModel: DidModel | null
  setDidModel: (didModel: DidModel | null) => void
}
const DidContext = createContext<DidContextType>({} as DidContextType)
export const useDidContext = () => {
  return useContext<DidContextType>(DidContext)
}

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}))

interface AppBarProps extends MuiAppBarProps {
  open?: boolean
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}))

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}))

const menulink = {
  textDecorationLine: 'none',
  color: '#444',
  fontWeight: 'bold',
}

export const SideMenuLayout = () => {
  const theme = useTheme()
  const [open, setOpen] = useState(false)
  const [isNowLoading, setNowLoading] = useState(false)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [didModel, setDidModel] = useState<DidModel | null>(null)

  const handleDrawerOpen = () => {
    setOpen(true)
  }

  const handleDrawerClose = () => {
    setOpen(false)
  }

  const nowLoadingValue: NowLoadingContextType = {
    isNowLoading,
    setNowLoading,
  }
  const settingsValue: SettingsContextType = { settings, setSettings }
  const didValue: DidContextType = { didModel, setDidModel }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" open={open}>
        <Toolbar sx={{ minHeight: '40px' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ mr: 2, ...(open && { display: 'none' }) }}
          >
            <IconMenu />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            {pkg.apptitle}
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === 'ltr' ? (
              <IconChevronLeft />
            ) : (
              <IconChevronRight />
            )}
          </IconButton>
        </DrawerHeader>
        <Divider />

        <List>
          <NavLink to="/" style={menulink} onClick={handleDrawerClose}>
            <ListItem button>
              <ListItemIcon sx={{ minWidth: '40px' }}>
                <IconHome />
              </ListItemIcon>
              <ListItemText primary="トップ" />
            </ListItem>
          </NavLink>
          <NavLink to="/qr/" style={menulink} onClick={handleDrawerClose}>
            <ListItem button>
              <ListItemIcon sx={{ minWidth: '40px' }}>
                <IconQrCode />
              </ListItemIcon>
              <ListItemText primary="QR読み込み" />
            </ListItem>
          </NavLink>
          <NavLink to="/did/" style={menulink} onClick={handleDrawerClose}>
            <ListItem button>
              <ListItemIcon sx={{ minWidth: '40px' }}>
                <IconKey />
              </ListItemIcon>
              <ListItemText primary="DID詳細" />
            </ListItem>
          </NavLink>
          <NavLink to="/vc/" style={menulink} onClick={handleDrawerClose}>
            <ListItem button>
              <ListItemIcon sx={{ minWidth: '40px' }}>
                <IconCardMembership />
              </ListItemIcon>
              <ListItemText primary="VC一覧" />
            </ListItem>
          </NavLink>
        </List>
        <Divider />
        <List>
          <NavLink to="/settings/" style={menulink} onClick={handleDrawerClose}>
            <ListItem button>
              <ListItemIcon sx={{ minWidth: '40px' }}>
                <IconSettings />
              </ListItemIcon>
              <ListItemText primary="設定" />
            </ListItem>
          </NavLink>
        </List>
        <Divider />
        <List>
          <ListItem sx={{ fontSize: '14px', color: 'gray' }}>
            ver: {pkg.version}
            <br></br>
            build: {pkg.buildno}
          </ListItem>
        </List>
      </Drawer>
      <NowLoadingContext.Provider value={nowLoadingValue}>
        <SettingsContext.Provider value={settingsValue}>
          <DidContext.Provider value={didValue}>
            <Main
              onClick={handleDrawerClose}
              sx={{ height: '100vh', width: '100%', paddingX: '8px' }}
            >
              <DrawerHeader sx={{ minHeight: '40px' }} />
              <Outlet />
            </Main>
            <Backdrop
              sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
              open={nowLoadingValue.isNowLoading}
            >
              <CircularProgress color="inherit" />
            </Backdrop>
          </DidContext.Provider>
        </SettingsContext.Provider>
      </NowLoadingContext.Provider>
      <div className="SW-update-dialog"></div>
    </Box>
  )
}
