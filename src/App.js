import React, { useState, useEffect } from "react";
import "./App.css";
import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import AppBar from "@material-ui/core/AppBar";
import Paper from "@material-ui/core/Paper";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import Fab from "@material-ui/core/Fab";
import AddIcon from "@material-ui/icons/Add";
import Help from "./Help";
import Editor from "./Editor";
import {
  HashRouter as Router,
  Switch,
  Route,
  Link,
  Redirect
} from "react-router-dom";
import { generateUid } from "d2/lib/uid";
import { asyncForEach } from "./support/asyncForEach";
import Dhis2 from "./support/Dhis2";

import builtInRecipes from "./recipes";

const useStyles = makeStyles(theme => ({
  root: {
    width: "100%",
    margin: "auto"
  },
  paper: {
    paddingBottom: "100%",
    paddingLeft: "100px"
  },
  fab: {
    position: "absolute",
    bottom: theme.spacing(2),
    right: theme.spacing(2)
  }
}));

function RecipePage({
  classes,
  match,
  recipes,
  setRecipe,
  setRecipes,
  history,
  onSave
}) {
  let recipe = recipes.find(r => r.id === match.params.recipeId);
  if (recipe === undefined) {
    recipe = recipes[0];
  }
  setRecipe(recipe);
  function newRecipe() {
    const newR = freshRecipe();
    setRecipes(recipes.concat([newR]));
    setRecipe(newR);
    history.push(`/recipes/` + newR.id);
  }
  return (
    <>
      <Editor key={recipe.id} recipe={recipe} dhis2={dhis2} onSave={onSave} />
      <Fab className={classes.fab} onClick={newRecipe}>
        <AddIcon />
      </Fab>
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
    fresh: true
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
        await asyncForEach(keys, async key => {
          const response = await fetch(
            api.baseUrl + "/dataStore/taskr/" + key,
            {
              headers: api.defaultHeaders
            }
          );
          const buffer = await response.arrayBuffer();
          let decoder = new TextDecoder("iso-8859-1");
          let text = decoder.decode(buffer);
          const task = JSON.parse(text);

          tasks.push(task);
        });
      } catch (e) {
        console.log(e);
      }
      if (tasks.length == 0) {
        tasks.push(freshRecipe());
      }

      setRecipes(tasks.concat(builtInRecipes));
    }
  }

  useEffect(() => {
    loadRecipes();
  }, [recipes, setRecipes]);

  async function onSave(modifiedRecipe) {
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
  }

  const [recipe, setRecipe] = useState(undefined);
  return (
    <Router>
      {recipes === undefined && <span>Loading...</span>}
      {recipes && (
        <div className={classes.root}>
          <AppBar position="static" color="primary">
            <Toolbar>
              <IconButton
                edge="start"
                className={classes.menuButton}
                color="inherit"
                aria-label="menu"
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" color="inherit">
                Taskr : your task runner.
              </Typography>
              <div style={{ marginLeft: "100px" }}>
                <Select
                  color="inherit"
                  value={recipe}
                  style={{ width: "400px", color: "white" }}
                  onChange={event => {
                    const r = event.target.value;
                    setRecipe(r);
                  }}
                >
                  {recipes.map(recipe => (
                    <MenuItem
                      value={recipe}
                      component={Link}
                      to={"/recipes/" + recipe.id}
                    >
                      {recipe.name}
                    </MenuItem>
                  ))}
                </Select>
              </div>
            </Toolbar>
          </AppBar>
          <Paper className={classes.paper}>
            <Help></Help>
            <Switch>
              <Route
                path={`/recipes/:recipeId`}
                render={props => (
                  <RecipePage
                    classes={classes}
                    recipes={recipes}
                    match={props.match}
                    setRecipe={setRecipe}
                    setRecipes={setRecipes}
                    history={props.history}
                    onSave={onSave}
                  />
                )}
              />

              <Redirect to={"/recipes/D5a1DVMw7FV"} />
            </Switch>
          </Paper>
        </div>
      )}
    </Router>
  );
}
export default App;
