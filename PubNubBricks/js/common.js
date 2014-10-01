/*
    FILE: common.js

    Some common Javascript functions.

    (c) 2014 Android Technologies, Inc.

    Published under the MIT license
*/

// Get the URL arguments passed to the current web page and return them
//  as an array of name value pairs.
function getUrlVars()
{
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');

    for (var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }

    return vars;
}

// Get one URL argument.  
function getUrlVar(name)
{
    return $.getUrlVars()[name];
}

// Use JQuery to find an element of a given type that *ends with* the given query string.
function findElementByEndsWithID(elemType, endsWithStr)
{
    if (typeof elemType == "undefined" || elemType == null)
        throw new Error("(findElementByEndsWithID) The element type is unassigned.");

    if (typeof endsWithStr == "undefined" || endsWithStr == null)
        throw new Error("(findElementByEndsWithID) The string to find at the end of the element ID is unassigned.");

    var searchPattern = elemType + "[id$='" + endsWithStr + "']";

    var searchResult = $(searchPattern);

    // If the search result is empty, return NULL.  Could not find an element with the given criteria.
    if (searchResult.length < 1)
        return null;

    // If there is more than one result, thrown an error to warn the consumer of this call.
    if (searchResult.length > 1)
        throw new Error("(findElementByEndsWithID) More than one element had an ID that ended with: " + endsWithStr);

    // Return the element found.
    return searchResult[0];
}

// Since DIVs are the most common element to search for, this is a little convenience function
//  to make calling findElementByEndsWithID() a little easier.
function findDivByEndsWithID(endsWithStr)
{
    return findElementByEndsWithID("div", endsWithStr);
}

// We also look for table data elements too. This is a little convenience function
//  to make calling findElementByEndsWithID() a little easier.
function findTdByEndsWithID(endsWithStr)
{
    return findElementByEndsWithID("td", endsWithStr);
}

// Creates a simple point object.
function makePoint(x, y)
{
    if (typeof x == "undefined" || x == null)
    {
        throw new Error("(point) The x value is unassigned.");
        return null;
    }

    if (typeof y == "undefined" || y == null)
    {
        throw new Error("(point) The y value is unassigned.");
        return null;
    }

    return { x: x, y: y };
}

// Find an element using JQuery by its ID.
//
// RETURNS: NULL if no element was found with the given ID.  If more than one
//  element was found with that ID, an error is thrown to warn the code that calls us.
function getJQueryElementById(elemID)
{
    if (typeof elemID == "undefined" || elemID == null)
        throw new Error("(getJQueryElementById) The element ID is unassigned.");

    var searchResult = $("#" + elemID);

    // If the search result is empty, return NULL.  Could not find an element with the given criteria.
    if (searchResult.length < 1)
        return null;

    // If there is more than one result, thrown an error to warn the consumer of this call.
    if (searchResult.length > 1)
        throw new Error("(getJQueryElementById) More than one element had an ID equal to: " + endsWithStr);

    // Return the element found.
    return searchResult[0];
}

// Quick function to return the center of an HTML element using RELATIVE coordinates.
function centerOfElementRelative(elemID)
{
    if (typeof elemID == "undefined" || elemID == null)
        throw new Error("(centerOfElementRelative) The given DIV ID is unassigned.");

    // var centerElem = getJQueryElementById(elemID);
    var centerElem = $("#" + elemID);

    if (typeof centerElem == "undefined" || centerElem == null)
        throw new Error("(centerOfElementRelative) There is no element with the given ID: " + elemID);

    // Calculate the center X and Y values from the given DIV.
    var centerX = centerElem.offset().left + centerElem.width() / 2;
    var centerY = centerElem.offset().top + centerElem.height() / 2;

    // Make the coordinates relative the document body offsets.
    centerX -= (document.body.offsetWidth / 2);
    centerY -= (document.body.offsetHeight / 2);

    return makePoint(centerX, centerY);
}

// Quick function to return the center of an HTML element using absolute coordinates.
function centerOfElementAbsolue(elemID)
{
    if (typeof elemID == "undefined" || elemID == null)
        throw new Error("(centerOfElementAbsolue) The given DIV ID is unassigned.");

    // var centerElem = getJQueryElementById(elemID);
    var centerElem = $("#" + elemID);

    if (typeof centerElem == "undefined" || centerElem == null)
        throw new Error("(centerOfElementAbsolue) There is no element with the given ID: " + elemID);

    // Calculate the center X and Y values from the given DIV.
    var centerX = centerElem.offset().left + centerElem.width() / 2;
    var centerY = centerElem.offset().top + centerElem.height() / 2;

    return makePoint(centerX, centerY);
}

