import React, { Suspense } from "react";
import "./App.css";
import { QueryClient, QueryClientProvider } from "react-query";
import { makeStyles } from "@material-ui/core/styles";
import { Typography, AppBar, Button, Paper, Toolbar, Grid } from "@material-ui/core"
import {
  HashRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";
import { generateUid } from "d2/lib/uid";
import RecipesPage from "./RecipesPage";
import Dhis2 from "./support/Dhis2";
import RecipePage from "./RecipePage";
import AppDrawer from "./AppDrawer";


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
  drawerHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: "8px 8px",
  },
}));

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
                    <AppDrawer classes={classes} />
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
