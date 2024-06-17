"use client";

import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { CssBaseline, Stack } from "@mui/material";
import { ThemeProvider as MUIThemeProvider } from "@mui/material/styles";
import React from "react";
import { useOidc } from "@axa-fr/react-oidc";
import { useOIDCContext } from "@/hooks/oidcConfiguration";
import { useMUITheme } from "@/hooks/theme";
import { useMetadata, Metadata } from "@/hooks/metadata";

import { useSearchParamsUtils } from "@/hooks/searchParamsUtils";
import { NavigationContext } from "@/contexts/NavigationProvider";

/**
 * Login form
 * @param logoURL the URL of the logo, optional
 * @returns a form
 */
export function LoginForm({
  logoURL = "/DIRAC-logo-minimal.png",
}: {
  logoURL?: string;
}) {
  const theme = useMUITheme();
  const { setPath } = React.useContext(NavigationContext);
  const { metadata, error, isLoading } = useMetadata();
  const [selectedVO, setSelectedVO] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const { configuration, setConfiguration } = useOIDCContext();
  const { isAuthenticated, login } = useOidc(configuration?.scope);

  const { getParam } = useSearchParamsUtils();

  // Login if not authenticated
  useEffect(() => {
    if (configuration && configuration.scope && isAuthenticated === false) {
      sessionStorage.setItem("oidcScope", JSON.stringify(configuration.scope));
      login();
    }
  }, [configuration, isAuthenticated, login]);

  useEffect(() => {
    // Redirect to dashboard if already authenticated
    if (isAuthenticated) {
      const redirect = getParam("redirect");
      if (redirect) {
        setPath(redirect);
      } else {
        setPath("/");
      }
    }
  }, [getParam, isAuthenticated, setPath]);

  // Get default group
  const getDefaultGroup = (
    metadata: Metadata | undefined,
    vo: string,
  ): string => {
    if (!metadata) {
      return "";
    }

    const defaultGroup = metadata.virtual_organizations[vo]?.default_group;
    if (defaultGroup) {
      return defaultGroup;
    } else {
      const groupKeys = Object.keys(metadata.virtual_organizations[vo].groups);
      return groupKeys.length > 0 ? groupKeys[0] : "";
    }
  };

  // Set vo
  const handleVOChange = (
    event: React.SyntheticEvent,
    newValue: string | null,
  ) => {
    if (newValue) {
      setSelectedVO(newValue);
      setSelectedGroup(getDefaultGroup(metadata, newValue));
    }
  };

  // Set group
  const handleGroupChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    setSelectedGroup(value);
  };

  // Update OIDC configuration
  const handleConfigurationChanges = () => {
    if (selectedVO && selectedGroup && configuration) {
      const newScope = `vo:${selectedVO} group:${selectedGroup}`;
      setConfiguration({
        ...configuration,
        scope: newScope,
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>An error occurred while fetching metadata.</div>;
  }
  if (!metadata) {
    return <div>No metadata found.</div>;
  }

  // Is there only one VO?
  const singleVO =
    metadata && Object.keys(metadata.virtual_organizations).length === 1;
  if (singleVO && !selectedVO) {
    setSelectedVO(Object.keys(metadata.virtual_organizations)[0]);
    setSelectedGroup(
      getDefaultGroup(metadata, Object.keys(metadata.virtual_organizations)[0]),
    );
  }

  return (
    <React.Fragment>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />

        <Box
          sx={{
            ml: { xs: "5%", md: "30%" },
            mr: { xs: "5%", md: "30%" },
          }}
        >
          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              paddingTop: "10%",
              paddingBottom: "10%",
            }}
          >
            <img src={logoURL} alt="DIRAC logo" width={150} height={150} />
          </Box>
          {singleVO ? (
            <Typography
              variant="h3"
              gutterBottom
              sx={{ textAlign: "center" }}
              data-testid="h3-vo-name"
            >
              {selectedVO}
            </Typography>
          ) : (
            <Autocomplete
              options={Object.keys(metadata.virtual_organizations)}
              getOptionLabel={(option) => option}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Virtual Organization"
                  variant="outlined"
                  data-testid="autocomplete-vo-select"
                />
              )}
              value={selectedVO}
              onChange={handleVOChange}
              sx={{
                "& .MuiAutocomplete-root": {
                  // Style changes when an option is selected
                  opacity: selectedVO ? 0.5 : 1,
                },
              }}
            />
          )}
          {selectedVO && (
            <Box sx={{ mt: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Select a Group</InputLabel>
                <Select
                  name={selectedVO}
                  value={
                    selectedGroup ||
                    metadata.virtual_organizations[selectedVO].default_group
                  }
                  label="Select a Group"
                  onChange={handleGroupChange}
                  data-testid="select-group"
                >
                  {Object.keys(
                    metadata.virtual_organizations[selectedVO].groups,
                  ).map((groupKey) => (
                    <MenuItem key={groupKey} value={groupKey}>
                      {groupKey}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                sx={{ mt: 5, width: "100%" }}
              >
                <Button
                  variant="contained"
                  sx={{
                    flexGrow: 1,
                  }}
                  onClick={handleConfigurationChanges}
                  data-testid="button-login"
                >
                  Login through your Identity Provider
                </Button>
                <Button variant="outlined" onClick={() => {}}>
                  Advanced Options
                </Button>
              </Stack>
              <Typography
                sx={{ paddingTop: "5%", color: "gray", textAlign: "center" }}
              >
                Need help?{" "}
                {metadata.virtual_organizations[selectedVO].support.message}
              </Typography>
            </Box>
          )}
        </Box>
      </MUIThemeProvider>
    </React.Fragment>
  );
}
