import React, { useState } from "react";
import { useQuery } from "react-query";

import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import Box from "@material-ui/core/Box";
import { makeStyles } from "@material-ui/core/styles";
import InputBase from "@material-ui/core/InputBase";
import IconButton from "@material-ui/core/IconButton";
import Paper from "@material-ui/core/Paper";
import SearchIcon from "@material-ui/icons/Search";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import AddIcon from "@material-ui/icons/Add";
import { Fab } from "@material-ui/core";
import builtInRecipes from "./recipes";

import { loadRecipes } from "./support/loadRecipes";

const useStyles = makeStyles(theme => ({
  search: {
    width: 280,
    margin: 10,
    paddingLeft: 10
  },
  card: {
    minWidth: 275,
    maxWidth: 300,
    minHeight: 150,
    maxHeight: 250,
    margin: "10px"
  },
  bullet: {
    display: "inline-block",
    margin: "0 2px",
    transform: "scale(0.8)"
  },
  title: {
    fontSize: 18
  },
  pos: {
    marginBottom: 12
  },
  fab: {
    position: "fixed",
    zIndex: 10,
    bottom: theme.spacing(4),
    right: theme.spacing(4),
    backgroundColor: "red",
    color: "white"
  }
}));

const RecipesPage = (props) => {
  const { dhis2, onNewRecipe, history, freshRecipe } = props;
  const classes = useStyles();
  const [filter, setFilter] = useState("");
  const handleInputChange = e => {
    const { value } = e.target;
    setFilter(value);
  };
  const [recipes, setRecipes] = useState(undefined);

  const loadRecipesQuery = useQuery("loadRecipes", 
    async () => {
      const tasks = await loadRecipes(dhis2, freshRecipe)
      return tasks;
    },
    {
      onSuccess: (tasks) => {
        setRecipes(tasks.concat(builtInRecipes.sort((a, b) => a.name > b.name)));
      },
      onError: (error) => {
        console.log(error);
      }
    }
  )
  
  const isLoading = loadRecipesQuery.isLoading || loadRecipesQuery.isFetching || loadRecipesQuery.isRefetching;
  return (
    <>
     {isLoading && <span>Loading...</span>}
     {recipes && (
       <div>
        <Paper className={classes.search}>
          <IconButton
            type="submit"
            className={classes.iconButton}
            aria-label="search"
          >
            <SearchIcon />
          </IconButton>
          <InputBase
            className={classes.input}
            placeholder="Search"
            inputProps={{ "aria-label": "search" }}
            onChange={handleInputChange}
            value={filter}
          />
        </Paper>
        <Fab className={classes.fab + " no-print"} onClick={() => onNewRecipe(history)}>
          <AddIcon />
        </Fab>
        <Box
          display="flex"
          width="100%"
          justifyContent="space-between"
          flexWrap="wrap"
          alignItems="flex-center"
          alignContent="space-around"
        >
          
          {recipes
            .filter(recipe =>
              recipe.name.toLowerCase().includes(filter.toLowerCase())
            )
            .map(recipe => (
              <Card
                key={recipe.id}
                className={classes.card}
                style={{
                  flex: "10 10 20%",
                  alignSelf: "stretch",
                  alignContent: "stretch",
                  backgroundColor: recipe.local ? "white" : "rgb(227 231 239)"
                }}
              >
                <CardContent>
                  <Typography className={classes.title} gutterBottom>
                    {recipe.name}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    href={"#/recipes/" + recipe.id + "/run"}
                    color="primary"
                  >
                  <PlayArrowIcon />
                    Show
                  </Button>
                  <span style={{ width: "300px" }}></span>
                  <Button size="small" href={"#/recipes/" + recipe.id}>
                    Edit
                  </Button>
                </CardActions>
              </Card>
            ))
          }
        </Box>
      </div>
     )}
    </>
  );
}

export default RecipesPage;
