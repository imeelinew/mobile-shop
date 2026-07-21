module.exports = {
    plugins: {
        'postcss-pxtorem': {
            rootValue({ file }) {
                return file && file.includes('vant') ? 37.5 : 75
            },
            propList: ['*'],
        },
    },
}