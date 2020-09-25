import React, { useState } from "react";
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

const useStyles = makeStyles({
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
  }
});

function RecipesPage({ match, recipes }) {
  const classes = useStyles();
  const [filter, setFilter] = useState("");
  const handleInputChange = e => {
    const { name, value } = e.target;
    setFilter(value);
  };
  return (
    <>
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
      <Box
        display="flex"
        width="100%"
        justifyContent="flex-start"
        flexWrap="wrap"
        alignItems="flex-start"
        alignContent="space-around"
      >
        {recipes
          .filter(recipe =>
            recipe.name.toLowerCase().includes(filter.toLowerCase())
          )
          .map(recipe => (
            <Card
              className={classes.card}
              style={{
                flex: "10 10 20%",
                alignSelf: "stretch",
                alignContent: "stretch",
                backgroundColor: recipe.local ? "white" : "lightgrey"
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
          ))}
      </Box>
    </>
  );
}

export default RecipesPage;
