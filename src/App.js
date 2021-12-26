import React, { useState, useEffect, Suspense } from "react";
import "./App.css";
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

function RecipePage({
  classes,
  match,
  recipes,
  setRecipe,
  setRecipes,
  history,
  onSave,
  editable,
}) {
  const query = useQuery();
  const autorun = query.get("autorun") === "true";

  let recipe = recipes.find((r) => r.id === match.params.recipeId);
  if (recipe === undefined) {
    recipe = recipes[0];
  }
  setRecipe(recipe);
  return (
    <>
      <Editor
        key={recipe.id}
        recipe={recipe}
        dhis2={dhis2}
        onSave={onSave}
        editable={editable}
        autorun={autorun}
      />
    </>
  );
}

function freshRecipe() {
  return {
    id: generateUid(),
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

function App() {
  const classes = useStyles();
  const [recipes, setRecipes] = useState(undefined);
  async function loadRecipes() {
    if (recipes === undefined) {
      const tasks = [];
      const api = await dhis2.api();
      try {
        const keys = await api.get("dataStore/taskr");
        await asyncForEach(keys, async (key) => {
          const response = await fetch(
            api.baseUrl + "/dataStore/taskr/" + key,
            {
              headers: api.defaultHeaders,
            }
          );
          const buffer = await response.arrayBuffer();
          let decoder = new TextDecoder("iso-8859-1");
          let text = decoder.decode(buffer);
          const task = JSON.parse(text);
          task.local = true;
          tasks.push(task);
        });
      } catch (e) {
        console.log(e);
      }
      if (tasks.length == 0) {
        tasks.push(freshRecipe());
      }

      setRecipes(tasks.concat(builtInRecipes.sort((a, b) => a.name > b.name)));
    }
  }

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes, recipes, setRecipes]);

  async function onSave(modifiedRecipe) {
    try {
      const api = await dhis2.api();
      try {
        const createResp = await api.post(
          "/dataStore/taskr/" + modifiedRecipe.id,
          modifiedRecipe
        );
        delete recipe.fresh;
      } catch (error) {}

      const updateResp = await api.update(
        "/dataStore/taskr/" + modifiedRecipe.id,
        modifiedRecipe
      );
      window.location.reload();
    } catch (error) {
      alert("Something went really wrong :" + (error.message || error));
    }
  }

  const [recipe, setRecipe] = useState(undefined);

  function onNewRecipe(history) {
    const newR = freshRecipe();
    setRecipes(recipes.concat([newR]));
    setRecipe(newR);
    history.push(`/recipes/` + newR.id);
  }

  return (
    <Router>
      {recipes === undefined && <span>Loading...</span>}
      {recipes && (
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
                    classes={classes}
                    recipes={recipes}
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
                      classes={classes}
                      recipes={recipes}
                      match={props.match}
                      setRecipe={setRecipe}
                      setRecipes={setRecipes}
                      history={props.history}
                      onSave={onSave}
                      editable={true}
                    />
                  );
                }}
              />
              <Route
                path={`/recipes/:recipeId/run`}
                render={(props) => (
                  <RecipePage
                    classes={classes}
                    recipes={recipes}
                    match={props.match}
                    setRecipe={setRecipe}
                    setRecipes={setRecipes}
                    history={props.history}
                    onSave={onSave}
                    editable={false}
                  />
                )}
              />

              <Redirect to={"/recipes"} />
            </Switch>
          </Paper>
        </div>
      )}
    </Router>
  );
}
export default App;
