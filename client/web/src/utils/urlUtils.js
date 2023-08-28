/**
 * src/utils/urlUtils.js
 * url related utils.
 *
 * created by pycui on 08/07/23
 */
import { isIP } from 'is-ip';

// there is a bug in this block, it does not work on ec2 if its hosted on another port like 3000, it just goes to the default port 80
export const getHostName = () => {
  var currentHost = window.location.host;
  var parts = currentHost.split(':');
  var hostname = parts[0];
  // Local deployment uses 8000 port by default.
  var newPort = '8000';

  if (!(hostname === 'localhost' || isIP(hostname))) {
    // Remove www. from hostname
    hostname = hostname.replace('www.', '');
    //hostname = 'api.' + hostname;
    newPort = window.location.protocol === 'https:' ? 443 : 8000;
  }
  var newHost = hostname + ':' + newPort;
  return newHost;
};
