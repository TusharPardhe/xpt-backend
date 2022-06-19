const Airdrop = require("../models/Airdrop");
const { ERROR_CODES } = require("../constants/app.constants");

const fetchAirdropsList = async (request, response) => {
    try {
        let {
            query: { offset, limit, pageNumber },
        } = request;

        // conversions and default values
        offset = offset ? parseInt(offset) : 0;
        limit = limit ? parseInt(limit) : 100;
        pageNumber = pageNumber ? parseInt(pageNumber) - 1 : 0;

        if (offset < 0 || limit < 0 || pageNumber < 0) {
            response.status(400).send({ error: ERROR_CODES[400] });
            return;
        }
        // getting data from db
        const list = await Airdrop.find({});

        // getting useful information
        let airdropsList = list
            ? list.map((airdrop) => {
                  const {
                      projectName,
                      ticker,
                      currencyName,
                      date,
                      issuer,
                      addedByAccount,
                      blackholed,
                      xummKyc,
                      noFreeze,
                      socials,
                      description,
                      show,
                  } = airdrop;
                  const details = {
                      projectName,
                      ticker,
                      currencyName,
                      date,
                      issuer,
                      addedByAccount,
                      blackholed,
                      xummKyc,
                      noFreeze,
                      socials,
                      description,
                  };

                  if (show) {
                      return details;
                  }
              })
            : [];

        // slicing array based on query params
        const startingIndex = pageNumber * limit + offset;
        const endingIndex = limit + startingIndex;
        airdropsList = airdropsList.slice(startingIndex, endingIndex);

        response.status(200).send(airdropsList);
    } catch (err) {
        console.log(err);
        response.status(500).send({ error: ERROR_CODES[500] });
    }
    return;
};

module.exports = fetchAirdropsList;
