import React, { useState } from "react";
import "./App.css";
import { IconButton, List, ListItem, ListItemIcon, ListItemText, Drawer, Grid } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import BorderAllIcon from "@material-ui/icons/BorderAll"
import ExitIcon from "@material-ui/icons/ExitToApp";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import MenuIcon from "@material-ui/icons/Menu";


const useStyles = makeStyles((theme) => ({
  drawerHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: "8px 8px",
  },
}));

const AppDrawer = () => {
  const classes = useStyles();

  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = (open, path) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }

    if (path) {
      window.location = path;
    }

    setDrawerOpen(open);
  };

  return (
    <>
      <IconButton
        edge="start"
        color="inherit"
        aria-label="menu"
        onClick={toggleDrawer(true)}
      >
        <MenuIcon />
      </IconButton>
      <Drawer
        variant="persistent"
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        <div className={classes.drawerHeader}>
          <IconButton onClick={toggleDrawer(false)}>
            <ChevronLeftIcon />
          </IconButton>
        </div>
        <List>
          <ListItem 
            key={"allRecipes"} 
            onClick={toggleDrawer(false, "#/recipes/")} 
            disablePadding
          >
            <IconButton>
              <ListItemIcon>
                <BorderAllIcon />
              </ListItemIcon>
              <ListItemText primary={"Recipes"} />
            </IconButton>
          </ListItem>
          <ListItem 
            key={"dhis2"} 
            onClick={toggleDrawer(false, "/")}
            disablePadding
          >
            <IconButton>
              <ListItemIcon>
                <ExitIcon />
              </ListItemIcon>
              <ListItemText primary={"Return to DHIS2"} />
            </IconButton>
          </ListItem>
        </List>
      </Drawer>
    </>
  )
}

export default AppDrawer;