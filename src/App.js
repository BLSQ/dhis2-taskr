import React, { useState, useEffect, Suspense } from "react";
import "./App.css";
import { QueryClient, QueryClientProvider } from "react-query";
import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import AppBar from "@material-ui/core/AppBar";
import Button from "@material-ui/core/Button";
import Paper from "@material-ui/core/Paper";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
import Grid from "@material-ui/core/Grid";

import Editor from "./Editor";
import {
  HashRouter as Router,
  Switch,
  Route,
  Redirect,
  useLocation,
} from "react-router-dom";
import { generateUid } from "d2/lib/uid";
import { asyncForEach } from "./support/asyncForEach";
import RecipesPage from "./RecipesPage";
import Dhis2 from "./support/Dhis2";
import builtInRecipes from "./recipes";
import RecipePage from "./RecipePage";

const DocPage = React.lazy(() => import("./DocPage"));

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
    margin: "auto",
    backgroundColor: "#eeeeee",
  },
  paper: {
    paddingBottom: "100%",
    paddingLeft: "20px",
    backgroundColor: "#eeeeee",
  },
}));

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function freshRecipe(recipeId) {
  return {
    id: recipeId || generateUid(),
    name: "New - ",
    code: `
    // press crtl-r to run
    const api = await dhis2.api();
    const ou = await api.get("organisationUnits", {
    fields: "id,name",
    paging: false
    });
    return ou.organisationUnits
    `,
    editable: true,
    fresh: true,
  };
}

const dhis2 = new Dhis2();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const classes = useStyles();

  function onNewRecipe(history) {
    const newR = freshRecipe();
    history.push(`/recipes/` + newR.id);
  }

  return (
    <Router>
      <QueryClientProvider client={queryClient}>
          <div className={classes.root + " reportPage"}>
            <AppBar position="static" color="primary" className="no-print">
              <Toolbar>
                <Grid
                  container
                  justify="space-between"
                  alignItems="center"
                  alignContent="center"
                >
                  <Grid item>
                    <IconButton
                      edge="start"
                      className={classes.menuButton}
                      color="inherit"
                      aria-label="menu"
                      href={"#/recipes/"}
                    >
                      <MenuIcon />
                    </IconButton>
                  </Grid>
                  <Grid item>
                    <Typography variant="h6" color="inherit">
                      Taskr : your task runner.
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Button href={"#/doc/"} color="inherit">
                      Documentation
                    </Button>
                  </Grid>
                </Grid>
              </Toolbar>
            </AppBar>
            <Paper className={classes.paper}>
              <Switch>
                <Route
                  path={`/doc`}
                  exact={true}
                  render={(props) => (
                    <Suspense fallback={<div>Loading...</div>}>
                      <DocPage match={props.match} />
                    </Suspense>
                  )}
                />
                <Route
                  path={`/doc/:section`}
                  render={(props) => (
                    <Suspense fallback={<div>Loading...</div>}>
                      <DocPage match={props.match} />
                    </Suspense>
                  )}
                />
                <Route
                  path={`/recipes`}
                  exact={true}
                  render={(props) => (
                    <RecipesPage
                      dhis2={dhis2}
                      freshRecipe={freshRecipe}
                      classes={classes}
                      history={props.history}
                      onNewRecipe={onNewRecipe}
                      match={props.match}
                    />
                  )}
                />
                <Route
                  path={`/recipes/:recipeId`}
                  exact={true}
                  render={(props) => {
                    return (
                      <RecipePage
                        dhis2={dhis2}
                        classes={classes}
                        freshRecipe={freshRecipe}
                        match={props.match}
                        history={props.history}
                        editable={true}
                      />
                    );
                  }}
                />
                <Route
                  path={`/recipes/:recipeId/run`}
                  render={(props) => (
                    <RecipePage
                      dhis2={dhis2}
                      classes={classes}
                      freshRecipe={freshRecipe}
                      match={props.match}
                      history={props.history}
                      editable={false}
                    />
                  )}
                />

                <Redirect to={"/recipes"} />
              </Switch>
            </Paper>
          </div>
      </QueryClientProvider>
    </Router>
  );
}
export default App;
