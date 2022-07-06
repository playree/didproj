import * as React from 'react'
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

const buildNo = '20220701.001'
const drawerWidth = 200

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

// ロード中表示のコンテキスト
export type NowLoadingContextType = {
  isNowLoading: boolean
  setNowLoading: (isNowLoading: boolean) => void
}
const NowLoadingContext = React.createContext<NowLoadingContextType>(
  {} as NowLoadingContextType
)
export const useNowLoadingContext = (): NowLoadingContextType => {
  return React.useContext<NowLoadingContextType>(NowLoadingContext)
}

export const SideMenuLayout = () => {
  const theme = useTheme()
  const [open, setOpen] = React.useState(false)
  const [isNowLoading, setNowLoading] = React.useState(false)

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
            ION PWA Sample
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
            build: {buildNo}
          </ListItem>
        </List>
      </Drawer>
      <NowLoadingContext.Provider value={nowLoadingValue}>
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
      </NowLoadingContext.Provider>
      <div className="SW-update-dialog"></div>
    </Box>
  )
}
